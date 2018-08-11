(function(){
  var polymer_ext, swal, load_css_file, ref$, set_intervention_disabled, set_intervention_disabled_permanently, disable_habitlab, open_url_in_new_tab, get_goals, add_log_habitlab_disabled, add_log_interventions, intervention;
  polymer_ext = require('libs_frontend/polymer_utils').polymer_ext;
  swal = require('sweetalert2');
  load_css_file = require('libs_common/content_script_utils').load_css_file;
  ref$ = require('libs_common/intervention_utils'), set_intervention_disabled = ref$.set_intervention_disabled, set_intervention_disabled_permanently = ref$.set_intervention_disabled_permanently;
  disable_habitlab = require('libs_common/disable_habitlab_utils').disable_habitlab;
  open_url_in_new_tab = require('libs_common/tab_utils').open_url_in_new_tab;
  get_goals = require('libs_common/goal_utils').get_goals;
  ref$ = require('libs_common/log_utils'), add_log_habitlab_disabled = ref$.add_log_habitlab_disabled, add_log_interventions = ref$.add_log_interventions;
  intervention = require('libs_common/intervention_info').get_intervention();
  polymer_ext({
    is: 'habitlab-options-popup-v2',
    doc: 'A habitlab options popup for user to turn off the current nudge or HabitLab',
    properties: {
      isdemo: {
        type: Boolean,
        observer: 'isdemo_changed'
      },
      intervention: {
        type: String,
        value: intervention != null ? intervention.name : '',
        observer: 'intervention_changed'
      },
      intervention_description: {
        type: String,
        value: intervention != null ? intervention.description : ''
      },
      goal_descriptions: {
        type: String
      },
      goal_name_to_info: {
        type: Object
      },
      screenshot: {
        type: String
      },
      other: {
        type: Object,
        value: {}
      },
      intervention_name: {
        type: String,
        value: intervention != null ? intervention.displayname : ''
      }
    },
    get_intervention_icon_url: function(){
      var url_path;
      if (intervention.generic_intervention != null) {
        url_path = 'interventions/' + intervention.generic_intervention + '/icon.svg';
      } else {
        if (intervention.custom === true) {
          url_path = 'icons/custom_intervention_icon.svg';
        } else {
          url_path = 'interventions/' + intervention.name + '/icon.svg';
        }
      }
      return chrome.extension.getURL(url_path).toString();
    },
    isdemo_changed: function(){
      if (this.isdemo) {
        return this.open();
      }
    },
    intervention_changed: async function(){
      var goal_name_to_info, goal_names, this$ = this;
      if (this.goal_name_to_info == null) {
        this.goal_name_to_info = (await get_goals());
      }
      goal_name_to_info = this.goal_name_to_info;
      goal_names = intervention.goals;
      return this.goal_descriptions = goal_names.map(function(it){
        return goal_name_to_info[it];
      }).map(function(it){
        return it.description;
      }).join(', ');
    },
    ready: async function(){
      return (await load_css_file('bower_components/sweetalert2/dist/sweetalert2.css'));
    },
    open: function(){
      return this.$$('#intervention_info_dialog').open();
    },
    disable_temp_callback: async function(){
      var self;
      this.$$('#intervention_info_dialog').close();
      self = this;
      this.fire('disable_intervention');
      swal({
        title: 'Turned Off!',
        text: 'This intervention will be turned off temporarily.'
      });
      return add_log_interventions({
        type: 'intervention_set_temporarily_disabled',
        page: 'habitlab-logo-v2',
        subpage: 'habitlab-options-popup-v2',
        category: 'intervention_enabledisable',
        now_enabled: false,
        is_permanent: false,
        manual: true,
        url: window.location.href,
        intervention_name: this.intervention
      });
    },
    disable_perm_callback: async function(){
      var self;
      this.$$('#intervention_info_dialog').close();
      self = this;
      this.fire('disable_intervention');
      swal({
        title: 'Turned Off!',
        text: 'This intervention will be turned off permanently. You can re-enable it from the HabitLab settings page.'
      });
      set_intervention_disabled_permanently(this.intervention);
      return add_log_interventions({
        type: 'intervention_set_always_disabled',
        page: 'habitlab-logo-v2',
        subpage: 'habitlab-options-popup-v2',
        category: 'intervention_enabledisable',
        now_enabled: false,
        is_permanent: true,
        manual: true,
        url: window.location.href,
        intervention_name: this.intervention
      });
    },
    disable_habitlab_callback: function(){
      this.$$('#intervention_info_dialog').close();
      disable_habitlab();
      swal({
        title: 'HabitLab Turned Off!',
        text: 'HabitLab will not show you interventions for the rest of today.'
      });
      return add_log_habitlab_disabled({
        page: 'habitlab-options-popup-v2',
        reason: 'turn_off_habitlab_in_turn_off_intervention',
        loaded_intervention: this.intervention,
        loaded_interventions: [this.intervention],
        url: window.location.href
      });
    },
    open_interventions_page: function(){
      open_url_in_new_tab('options.html#interventions');
      return this.$$('#intervention_info_dialog').close();
    },
    open_feedback_form: async function(){
      var feedback_form;
      feedback_form = document.createElement('feedback-form');
      feedback_form.screenshot = this.screenshot;
      feedback_form.other = this.other;
      this.$$('#intervention_info_dialog').close();
      document.body.appendChild(feedback_form);
      return feedback_form.open();
    }
  });
}).call(this);
