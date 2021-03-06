import Ember from "ember";

export default Ember.Object.extend({
  backing: 'overrideMe with window.localStorage or window.sessionStorage',

  unknownProperty: function(key) {
    var value; // = undefined;
    var backing = this.get('backing');
    var str = backing.getItem(key);
    if ( str )
    {
      try
      {
        value = JSON.parse(str);
      }
      catch (e)
      {
        console.log("Error parsing storage ['"+key+"']");
        backing.removeItem(key);
        this.notifyPropertyChange(key);
      }
    }

    return value;
  },

  setUnknownProperty: function(key, value) {
    var backing = this.get('backing');

    if ( value === undefined )
    {
      backing.removeItem(key);
    }
    else
    {
      backing.setItem(key, JSON.stringify(value));
    }

    this.notifyPropertyChange(key);
    return value;
  },

  clear: function() {
    var backing = this.get('backing');

    this.beginPropertyChanges();
    for ( var i = 0 ; i < backing.length ; i++ )
    {
      this.set(backing.key(i));
    }

    backing.clear();
    this.endPropertyChanges();
  },
});

