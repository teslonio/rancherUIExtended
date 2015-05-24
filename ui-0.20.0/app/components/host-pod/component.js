import Ember from 'ember';

export default Ember.Component.extend({
  model: null,
  classNames: ['pod','host','resource-action-hover'],
  classNameBindings: ['stateBorder','isMachine:machine-host'],

  actions: {
    newContainer: function() {
      this.get('model').send('newContainer');
    },
    addLogCollector: function(){


          this.get('model').send('addLogCollector');
          
    }
  },

  isMachine: Ember.computed.equal('model.type','machine'),
  isActive: Ember.computed.equal('model.state','active'),

  showAdd: function() {
    return this.get('isActive') && !this.get('isMachine');
  }.property('isActive','isMachine'),

  stateBackground: function() {
    return this.get('model.stateColor').replace("text-","bg-");
  }.property('model.stateColor'),

  stateBorder: function() {
    return this.get('model.stateColor').replace("text-","border-top-");
  }.property('model.stateColor'),

  iconColor: function() {
    var color = this.get('model.stateColor');
    if ( color.indexOf('danger') >= 0 )
    {
      return color;
    }
  }.property('model.stateColor'),
});
