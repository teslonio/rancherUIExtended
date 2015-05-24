import Ember from 'ember';
import Cattle from 'ui/utils/cattle';
import DownloadMachineConfig from 'ui/mixins/download-machine-config';

var HostController = Cattle.TransitioningResourceController.extend(DownloadMachineConfig, {
  actions: {
    activate: function() {
      return this.doAction('activate');
    },

    deactivate: function() {
      return this.doAction('deactivate');
    },

    delete: function() {
      var machine = this.get('machine');
      if ( machine )
      {
        return machine.delete();
      }
      else
      {
        return this.delete();
      }
    },

    purge: function() {
      return this.doAction('purge');
    },

    newContainer: function() {
      this.transitionToRoute('containers.new', {queryParams: {hostId: this.get('id')}});
    },

    addLogCollector: function(){


          var requestedHostId = this.get('id');
          var accountId = sessionStorage.getItem('projectId').split("\"")[1];

          $.get('/v1/settings/api.host',function(data){
          console.log('Got rancher server configuration, trying to provosion the log forwarder on the node.' );
          var  serverAddress = data.activeValue.split(':')[0];
          var logCollectionUrl = 'syslog://'+serverAddress+':5000';
          var logCollectorContainerConfig = {"startOnCreate":true,"publishAllPorts":false,"privileged":false,"stdinOpen":false,"tty":false,"type":"container","requestedHostId":requestedHostId,"networkIds":["1n2"],"environment":{},"dataVolumes":["/var/run/docker.sock:/tmp/docker.sock"],"dataVolumesFrom":[],"dns":[],"dnsSearch":[],"capAdd":[],"capDrop":[],"devices":[],"imageUuid":"docker:progrium/logspout","restartPolicy":{"name":"no"},"name":"logsCollector","description":"Container Logs Collector","command":[logCollectionUrl],"ports":[],"instanceLinks":{},"allocationState":null,"count":null,"created":null,"externalId":null,"firstRunning":null,"hostname":null,"kind":null,"removeTime":null,"removed":null,"systemContainer":null,"token":null,"uuid":null,"directory":null,"user":null,"domainName":null,"memorySwap":null,"memory":null,"cpuSet":null,"cpuShares":null,"primaryIpAddress":null,"primaryAssociatedIpAddress":null,"registryCredentialId":null,"commandArgs":null,"state":null,"transitioning":null,"transitioningMessage":null,"transitioningProgress":null,"id":null,"headers":null};
         
          $.ajax({
             url: "/v1/container",
             data: JSON.stringify(logCollectorContainerConfig),
             dataType: 'json',
             type: "POST",processData: false,
             beforeSend: function(xhr){xhr.setRequestHeader('Accept', 'application/json');xhr.setRequestHeader('x-api-project-id', accountId);xhr.setRequestHeader('authorization','None');xhr.setRequestHeader('x-api-no-challenge',true);xhr.setRequestHeader('Content-Type','application/json');},
             success: function(data) { console.log('Success!' +JSON.stringify(data) ); }
          });

         });
         
        

    },

    detail: function() {
      this.transitionToRoute('host', this.get('id'));
    },

    clone: function() {
      var machine = this.get('machine');
      var driver = machine.get('driver');
      this.transitionToRoute('hosts.new.'+driver, {queryParams: {machineId: machine.get('id')}});
    },
  },

  availableActions: function() {
    var a = this.get('actions');

    var out = [
//      { label: 'Add Container', icon: 'ss-plus',      action: 'newContainer', enabled: true,            color: 'text-primary' },
      { label: 'Activate',      icon: 'ss-play',      action: 'activate',     enabled: !!a.activate,    color: 'text-success'},
      { label: 'Deactivate',    icon: 'ss-pause',     action: 'deactivate',   enabled: !!a.deactivate,  color: 'text-danger'},
      { label: 'Delete',        icon: 'ss-trash',     action: 'promptDelete', enabled: !!a.remove, altAction: 'delete', color: 'text-warning' },
      { label: 'Purge',         icon: '',   action: 'purge',        enabled: !!a.purge, color: 'text-danger'},
      { divider: true },
    ];

    out.push({ label: 'View in API',   icon: '', action: 'goToApi',      enabled: true});
    if ( this.get('machine') )
    {
      if ( this.get('machine.links.config') )
      {
        out.push({ label: 'Machine Config',   icon: 'ss-download', action: 'machineConfig',      enabled: true});
      }

      out.push({ label: 'Clone',         icon: 'ss-copier',           action: 'clone',        enabled: true });
    }

    return out;
  }.property('actions.{activate,deactivate,remove,purge}','machine','machine.links.config'),

  triedToGetIp: false,
  displayIp: function() {
    var obj = (this.get('ipAddresses')||[]).get('firstObject');
    if ( obj )
    {
      return obj.get('address');
    }
    else if ( this && this.hasLink && this.hasLink('ipAddresses') && !this.get('triedToGetIp'))
    {
      this.set('triedToGetIp',true);
      this.importLink('ipAddresses');
    }

    return null;
  }.property('ipAddresses','ipAddresses.[]'),

  arrangedInstances: function() {
    return Ember.ArrayController.create({
      content: this.get('instances'),
      sortProperties: ['name','id']
    });
  }.property('instances.[]','instances.@each.{name,id}'),

  machine: function() {
    var phid = this.get('physicalHostId');
    if ( !phid )
    {
      return null;
    }

    var machine = this.get('store').getById('machine', phid);
    return machine;
  }.property('physicalHostId'),

  osBlurb: function() {
    // @TODO this always sends back Ubuntu
    if ( false && this.get('info.osInfo') )
    {
      return this.get('info.osInfo.distribution') + ' ' + this.get('info.osInfo.version');
    }
  }.property('info.osInfo.{distribution,version}'),

  cpuBlurb: function() {
    if ( this.get('info.cpuInfo.count') )
    {
      var ghz = Math.round(this.get('info.cpuInfo.mhz')/10)/100;

      if ( this.get('info.cpuInfo.count') > 1 )
      {
        return this.get('info.cpuInfo.count')+'x' + ghz + ' GHz';
      }
      else
      {
        return ghz + ' GHz';
      }
    }
  }.property('info.cpuInfo.{count,mhz}'),

  memoryBlurb: function() {
    if ( this.get('info.memoryInfo') )
    {
      var gb = Math.round((this.get('info.memoryInfo.memTotal')/1024)*100)/100;

      return gb + ' GiB';
    }
  }.property('info.memoryInfo.memTotal'),

  diskBlurb: function() {
    if ( this.get('info.diskInfo.mountPoints') )
    {
      var totalMb = 0;
      var mounts = this.get('info.diskInfo.mountPoints')||[];
      Object.keys(mounts).forEach((mountPoint) => {
        totalMb += mounts[mountPoint].total;
      });

      var gb = Math.round((totalMb/1024)*10)/10;
      return gb + ' GiB';
    }
  }.property('info.diskInfo.mountPoints.@each.total'),
});

HostController.reopenClass({
  stateMap: {
    'requested':        {icon: 'ss-tag',            color: 'text-danger'},
    'registering':      {icon: 'ss-tag',            color: 'text-danger'},
    'activating':       {icon: 'ss-tag',            color: 'text-danger'},
    'active':           {icon: 'ss-database',       color: 'text-success'},
    'reconnecting':     {icon: 'fa fa-circle-o-notch fa-spin', color: 'text-danger'},
    'updating-active':  {icon: 'ss-database',       color: 'text-success'},
    'updating-inactive':{icon: 'ss-alert',          color: 'text-danger'},
    'deactivating':     {icon: 'ss-down',           color: 'text-danger'},
    'inactive':         {icon: 'fa fa-circle',      color: 'text-danger'},
    'removing':         {icon: 'ss-trash',          color: 'text-danger'},
    'removed':          {icon: 'ss-trash',          color: 'text-danger'},
    'purging':          {icon: 'ss-tornado',        color: 'text-danger'},
    'purged':           {icon: 'ss-tornado',        color: 'text-danger'},
    'restoring':        {icon: 'ss-medicalcross',   color: 'text-danger'},
  }
});

export default HostController;
