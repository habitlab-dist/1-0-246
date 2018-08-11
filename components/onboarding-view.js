(function(){
  var swal, $, polymer_ext, load_css_file, ref$, start_syncing_all_data, stop_syncing_all_data, send_logging_enabled, send_logging_disabled, get_user_id, msg, log_pagenav;
  swal = require('sweetalert2');
  $ = require('jquery');
  polymer_ext = require('libs_frontend/polymer_utils').polymer_ext;
  load_css_file = require('libs_common/content_script_utils').load_css_file;
  ref$ = require('libs_backend/log_sync_utils'), start_syncing_all_data = ref$.start_syncing_all_data, stop_syncing_all_data = ref$.stop_syncing_all_data;
  ref$ = require('libs_backend/logging_enabled_utils'), send_logging_enabled = ref$.send_logging_enabled, send_logging_disabled = ref$.send_logging_disabled;
  get_user_id = require('libs_backend/background_common').get_user_id;
  msg = require('libs_common/localization_utils').msg;
  log_pagenav = require('libs_backend/log_utils').log_pagenav;
  polymer_ext({
    is: 'onboarding-view',
    properties: {
      slide_idx: {
        type: Number,
        value: function(){
          var output;
          if (window.hashdata_unparsed === 'last') {
            output = 5;
            if (localStorage.positive_goals_disabled === 'true') {
              output -= 1;
            }
            if (localStorage.difficulty_selector_disabled === 'true') {
              output -= 1;
            }
            if (localStorage.idea_voting_disabled === 'true') {
              output -= 1;
            }
            if (localStorage.signin_disabled === 'true') {
              output -= 1;
            }
            return output;
          }
          return 0;
        }(),
        observer: 'slide_changed'
      },
      prev_slide_idx: {
        type: Number,
        value: 0
      },
      habitlab_logo_url: {
        type: String,
        value: chrome.extension.getURL('icons/logo_gradient.svg')
      },
      habitlab_logo_white_url: {
        type: String,
        value: chrome.extension.getURL('icons/habitlab_icon_white_gradient.svg')
      },
      positive_goals_disabled: {
        type: Boolean,
        value: localStorage.positive_goals_disabled === 'true'
      },
      signin_disabled: {
        type: Boolean,
        value: localStorage.signin_disabled === 'true'
      },
      difficulty_selector_disabled: {
        type: Boolean,
        value: localStorage.difficulty_selector_disabled === 'true'
      },
      idea_voting_disabled: {
        type: Boolean,
        value: localStorage.idea_voting_disabled === 'true'
      },
      true_statement: {
        type: Boolean,
        value: true
      },
      last_slide_idx: {
        type: Number,
        value: function(){
          var output;
          output = 5;
          if (localStorage.positive_goals_disabled === 'true') {
            output -= 1;
          }
          if (localStorage.difficulty_selector_disabled === 'true') {
            output -= 1;
          }
          if (localStorage.idea_voting_disabled === 'true') {
            output -= 1;
          }
          if (localStorage.signin_disabled === 'true') {
            output -= 1;
          }
          return output;
        }()
      }
    },
    rerender_badges: function(){
      return this.$$('#badges_received').rerender();
    },
    see_what_gets_loggged_clicked: function(evt){
      return evt.stopPropagation();
    },
    get_stanford_icon: function(){
      return chrome.extension.getURL('icons/stanford.svg');
    },
    slide_changed: function(evt){
      var self, prev_slide_idx, slide, prev_slide, slidename, ref$;
      self = this;
      this.SM('.slide').stop();
      prev_slide_idx = this.prev_slide_idx;
      this.prev_slide_idx = this.slide_idx;
      slide = this.SM('.slide').eq(this.slide_idx);
      this.current_slide = slide;
      if (slide.find('.scroll_wrapper').length > 0) {
        slide.find('.scroll_wrapper')[0].scrollTop = 0;
      }
      if (prev_slide_idx === this.slide_idx - 1) {
        prev_slide = this.SM('.slide').eq(prev_slide_idx);
        prev_slide.animate({
          top: '-100vh'
        }, 1000);
        slide.css('top', '100vh');
        slide.show();
        slide.animate({
          top: '0px'
        }, 1000);
        this.animation_inprogress = true;
        setTimeout(function(){
          return self.animation_inprogress = false;
        }, 1000);
      } else if (prev_slide_idx === this.slide_idx + 1) {
        prev_slide = this.SM('.slide').eq(prev_slide_idx);
        prev_slide.animate({
          top: '+100vh'
        }, 1000);
        slide.css('top', '-100vh');
        slide.show();
        slide.animate({
          top: '0px'
        }, 1000);
        this.animation_inprogress = true;
        setTimeout(function(){
          self.animation_inprogress = false;
          return prev_slide.hide();
        }, 1000);
      } else {
        this.SM('.slide').hide();
        slide.show();
        slide.css('top', '0px');
        this.animation_inprogress = false;
      }
      slidename = '';
      if ((slide != null ? (ref$ = slide[0]) != null ? ref$.getAttribute('slide-name') : void 8 : void 8) != null) {
        slidename = slide[0].getAttribute('slide-name');
      }
      return log_pagenav({
        tab: 'onboarding',
        prev_slide_idx: prev_slide_idx,
        slide_idx: this.slide_idx,
        slidename: slidename
      });
    },
    onboarding_complete: function(){
      if (localStorage.sync_with_mobile !== 'true') {
        localStorage.sync_with_mobile = 'false';
      }
      this.$$('#dialog').open();
      if (localStorage.getItem('allow_logging') == null) {
        localStorage.setItem('allow_logging_on_default_with_onboarding', true);
        localStorage.setItem('allow_logging', true);
        send_logging_enabled({
          page: 'onboarding',
          manual: false,
          allow_logging_on_default_with_onboarding: true
        });
        start_syncing_all_data();
      }
      localStorage.setItem('onboarding_complete', 'true');
      $('body').css('overflow', 'auto');
      return this.fire('onboarding-complete', {});
    },
    next_button_clicked: async function(){
      var last_slide_idx;
      if (this.animation_inprogress) {
        return;
      }
      last_slide_idx = this.SM('.slide').length - 1;
      if (this.slide_idx === last_slide_idx) {
        this.onboarding_complete();
        return;
      }
      return this.next_slide();
    },
    next_slide: function(evt){
      var last_slide_idx;
      if (this.animation_inprogress) {
        return;
      }
      if (localStorage.difficulty_selector_forcedchoice === 'true') {
        if (localStorage.difficulty_selector_disabled !== 'true') {
          if (this.slide_idx === 1 && localStorage.user_chosen_difficulty == null) {
            if (evt != null) {
              swal('Please choose a difficulty level');
            }
            return;
          }
        }
      }
      last_slide_idx = this.SM('.slide').length - 1;
      if (this.slide_idx === last_slide_idx) {
        return;
      }
      this.slide_idx = Math.min(last_slide_idx, this.slide_idx + 1);
      last_slide_idx = this.SM('.slide').length - 1;
      if (this.slide_idx === last_slide_idx - 1) {
        return;
      }
      return this.SM('.onboarding_complete').show();
    },
    prev_slide: function(){
      var last_slide_idx;
      if (this.animation_inprogress) {
        return;
      }
      this.slide_idx = Math.max(0, this.slide_idx - 1);
      last_slide_idx = this.SM('.slide').length - 1;
      if (this.slide_idx === last_slide_idx) {
        return;
      }
      return this.SM('.onboarding_complete').hide();
    },
    rerender_onboarding_badges: function(){
      return this.$$('#badges_received').rerender();
    },
    get_icon: function(img_path){
      return chrome.extension.getURL('icons/' + img_path);
    },
    keydown_listener: function(evt){
      if (evt.which === 39 || evt.which === 40 || evt.which === 13) {
        return this.next_slide(true);
      } else if (evt.which === 37 || evt.which === 38) {
        return this.prev_slide();
      }
    },
    mousewheel_listener: function(evt){
      var scroll_wrapper, ref$, ref1$, last_slide_idx;
      if (this.animation_inprogress) {
        evt.preventDefault();
        return;
      }
      scroll_wrapper = this != null ? (ref$ = this.current_slide) != null ? (ref1$ = ref$.find('.scroll_wrapper')) != null ? ref1$[0] : void 8 : void 8 : void 8;
      if (scroll_wrapper != null) {
        if (evt.deltaY > 0 && scroll_wrapper.clientHeight + scroll_wrapper.scrollTop === scroll_wrapper.scrollHeight) {
          last_slide_idx = this.SM('.slide').length - 1;
          if (this.slide_idx < last_slide_idx) {
            evt.preventDefault();
            this.next_slide();
          }
        } else if (evt.deltaY < 0 && scroll_wrapper.scrollTop === 0) {
          if (this.slide_idx > 0) {
            evt.preventDefault();
            this.prev_slide();
          }
        }
      }
    },
    detached: function(){
      window.removeEventListener('keydown', this.keydown_listener_bound);
      window.removeEventListener('mousewheel', this.mousewheel_listener_bound);
      return window.removeEventListener('resize', this.window_resized_bound);
    },
    window_resized: function(){
      var current_height, target_height, current_width, target_width, scale_height, scale_width, scale;
      if (this.slide_idx === 1) {
        this.$.goal_selector.repaint_due_to_resize();
        return;
      } else if (this.slide_idx === 2 && this.$$('#positive_goal_selector') != null) {
        this.$$('#positive_goal_selector').repaint_due_to_resize();
      }
      current_height = 400;
      target_height = window.innerHeight - 80;
      current_width = 600;
      target_width = window.innerWidth - 20;
      scale_height = target_height / current_height;
      scale_width = target_width / current_width;
      scale = Math.min(scale_height, scale_width);
      return this.SM('.inner_slide').css({
        transform: 'scale(' + scale + ')'
      });
    },
    attached: function(){
      return this.window_resized();
    },
    insert_iframe_for_setting_userid: async function(){
      var userid, userid_setting_iframe;
      userid = (await get_user_id());
      userid_setting_iframe = $('<iframe id="setuseridiframe" src="https://habitlab.stanford.edu/setuserid?userid=' + userid + '" style="width: 0; height: 0; pointer-events: none; opacity: 0; display: none"></iframe>');
      return $('body').append(userid_setting_iframe);
    },
    ready: async function(){
      var self;
      this.style.opacity = 0;
      $('body').css('overflow', 'hidden');
      self = this;
      this.last_mousewheel_time = 0;
      this.last_mousewheel_deltaY = 0;
      this.keydown_listener_bound = this.keydown_listener.bind(this);
      this.mousewheel_listener_bound = this.mousewheel_listener.bind(this);
      this.window_resized_bound = this.window_resized.bind(this);
      window.addEventListener('resize', this.window_resized_bound);
      if (localStorage.getItem('allow_logging') == null && localStorage.getItem('irb_accepted') !== 'true') {
        this.$$('#irbdialog').open();
        this.$$('#irbdialog').addEventListener('irb-dialog-closed', function(){
          console.log('irb dialog closed');
          window.addEventListener('mousewheel', self.mousewheel_listener_bound);
          return window.addEventListener('keydown', self.keydown_listener_bound);
        });
      } else {
        window.addEventListener('mousewheel', this.mousewheel_listener_bound);
        window.addEventListener('keydown', this.keydown_listener_bound);
      }
      this.$$('#goal_selector').set_sites_and_goals();
      this.once_available('#badges_received').then(function(){
        self.slide_changed();
        return self.style.opacity = 1;
      });
      /*
      this.$.pagepiling.addEventListener 'mousewheel', (evt) ->
        console.log 'mousewheel on pagepiling'
        evt.preventDefault()
        evt.stopPropagation()
        return
      this.$.pagepiling.addEventListener 'wheel', (evt) ->
        console.log 'wheel on pagepiling'
        evt.preventDefault()
        evt.stopPropagation()
        return
      window.addEventListener 'mousewheel', (evt) ->
        console.log 'mousewheel on window'
        evt.preventDefault()
        evt.stopPropagation()
        return
      window.addEventListener 'wheel', (evt) ->
        console.log 'wheel on window'
        evt.preventDefault()
        evt.stopPropagation()
        return
      */
      if (chrome.runtime.getManifest().update_url == null) {
        if (localStorage.getItem('enable_debug_terminal') == null) {
          localStorage.setItem('enable_debug_terminal', 'true');
        }
      }
      this.$$('#goal_selector').repaint_due_to_resize_once_in_view();
      this.once_available('#positive_goal_selector').then(function(){
        self.$$('#positive_goal_selector').set_sites_and_goals();
        return self.$$('#positive_goal_selector').repaint_due_to_resize_once_in_view();
      });
      this.insert_iframe_for_setting_userid();
      return (await load_css_file('sweetalert2'));
    }
  }, [
    {
      source: require('libs_frontend/polymer_methods'),
      methods: ['S', 'SM', 'is_not_equal_to_any', 'is_equal', 'once_available']
    }, {
      source: require('libs_common/localization_utils'),
      methods: ['msg']
    }
  ]);
}).call(this);
