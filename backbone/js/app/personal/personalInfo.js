define(['templates/personalInfo.html'], function(template) {
  var personalInfoView = Backbone.View.extend({
    tagName: 'div',
    className: 'personal-info',

    template: _.template(template),
    
    initialize: function() {
      this.model.on('change', this.render, this);
      this.model.on('destroy', this.remove, this);
    },

    render: function() {
      var $el = $(this.el);
      $el.data('listId', this.model.get('id'));
      $el.html(this.template(this.model.toJSON()));
      return this;
    },

    open: function() {
      var self = this;
      return false;
    }
  });

  return personalInfoView;
});
