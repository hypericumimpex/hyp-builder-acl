/*
 * Elements for Users - Addon for WPBakery Page Builder
 * Mehmet Celik
 * v1.0.0
 *
 * Based on:
 * jQuery Repeatable Fields v1.5.0
 * http://www.rhyzz.com/repeatable-fields.html
 *
 * Copyright (c) 2014-2018 Rhyzz
 * License MIT
*/

(function($) {
	"use strict";

	$.fn.repeatable_fields = function(custom_settings) {
		var self = this;

		self.default_settings = {
			wrapper: '.vc-efu-wrapper',
			container: '.vc-efu-container',
			row: '.vc-efu-row',
			template: '.vc-efu-template',
			add: '.vc-efu-add',
			remove: '.vc-efu-remove',
			input: '.vc-efu-param-field',
			params: {},
			function: '',
			row_count_placeholder: '{{row-count-placeholder}}',

			is_sortable: true,
			sortable_options: null,
			move: '.vc-efu-move',
			move_up: '.vc-efu-move-up',
			move_down: '.vc-efu-move-down',
		};

		self.settings = $.extend({}, self.default_settings, custom_settings);

		self.populateURLParams = function(wrapper, container) {
			var params = [];
			$(container).children(self.settings.row + ':not(' + self.settings.template + ')').each(function () {
				var param = {};
				for (var id in self.settings.params){
					param[id] = '';
					if ($(this).find(self.settings.params[id]).length > 0)
						param[id] = $(this).find(self.settings.params[id]).val();
				}

				params.push(param);
			});

			if (params.length > 0) {
				var val = base64_encode( rawurlencode( JSON.stringify(params) ) );
				$(wrapper).children(self.settings.input).val(val);
			} else {
				$(wrapper).children(self.settings.input).val('');
			}
		};

		self.addNewRow = function(container){
			var row_template = $( $(container).children(self.settings.template).clone().removeClass(self.settings.template.replace('.', ''))[0].outerHTML );

			// Enable all form elements inside the row template
			$(row_template).find(':input').each(function() {
				$(this).prop('disabled', false);
			});

			var newRow = $(row_template).show().appendTo(container);

			var row_count = $(container).attr('data-rf-row-count');
			row_count++;

			$('*', newRow).each(function() {
				$.each(this.attributes, function() {
					this.value = this.value.replace(self.settings.row_count_placeholder, row_count - 1);
				});
			});
			$(container).attr('data-rf-row-count', row_count);

			return newRow;
		}

		self.callFunction = function(wrapper, container, trigger){
			$(document).trigger(trigger, [wrapper, container]);
			if (self.settings.function && (typeof self[self.settings.function] === 'function') ){
				self[self.settings.function](wrapper, container);
			}
		}

		self.initialize = function(parent) {
			$(self.settings.wrapper, parent).each(function() {
				var wrapper = this;

				var container = $(wrapper).children(self.settings.container);

				// Disable all form elements inside the row template
				$(container).children(self.settings.template).hide().find(':input').each(function() {
					$(this).prop('disabled', true);
				});

				var parameters = rawurldecode( base64_decode( $(wrapper).children(self.settings.input).val() ) );
				if (parameters) {
					parameters = JSON.parse(parameters);
					for (var i in parameters){
						var newRow = self.addNewRow(container);
						for (var id in self.settings.params){
							$(newRow).find(self.settings.params[id]).val(parameters[i][id]);
						}
					}
				}

				// Set row count
				var row_count = $(container).children(self.settings.row).filter(function() {
					return !$(this).hasClass(self.settings.template.replace('.', ''));
				}).length;
				$(container).attr('data-rf-row-count', row_count);

				// Add button click event
				$(wrapper).on('click', self.settings.add, function(event) {
					var newRow = self.addNewRow(container);
					self.callFunction(wrapper, container, 'efu-repeatable-fields-item-added');
					// The new row might have it's own repeatable field wrappers so initialize them too
					self.initialize(newRow);
					return false;
				});

				// Remove button click event
				$(wrapper).on('click', self.settings.remove, function(event) {
					$(this).parents(self.settings.row).first().remove();
					self.callFunction(wrapper, container, 'efu-repeatable-fields-item-removed');
					return false;
				});

				// On parameters change event
				if (!$.isEmptyObject(self.settings.params)) {
					var change = $.map(self.settings.params, function(val, key){
						return val;
					}).join(',');

					$(document).on("change", change, function () {
						self.callFunction(wrapper, container, 'efu-repeatable-fields-item-changed');
					});
				}

				if(self.settings.is_sortable === true) {
					if(typeof $.ui !== 'undefined' && typeof $.ui.sortable !== 'undefined') {
						var sortable_options = self.settings.sortable_options !== null ? self.settings.sortable_options : {};

						sortable_options.handle = self.settings.move;

						$(container).sortable(sortable_options);
					}

					$(container).on('click', function(event) {
						if(!$(event.target).is(self.settings.move_up) && !$(event.target).is(self.settings.move_down)) {
							return;
						}

						var steps = 1;
						var current_row = $(event.target).closest(self.settings.row);

						var i = 0;

						if($(event.target).is(self.settings.move_up) === true) {
							var previous_row;

							for(i = 0; steps === -1 ? true : i < steps; i++) {
								if(previous_row === undefined) {
									if(current_row.prev().not(self.settings.template).length === 1) {
										previous_row = current_row.prev();
									}
									else {
										break;
									}
								}
								else {
									if(previous_row.prev().not(self.settings.template).length === 1) {
										previous_row = previous_row.prev();
									}
									else {
										break;
									}
								}
							}

							if(previous_row !== undefined) {
								previous_row.before(current_row);
							}
						}
						else if($(event.target).is(self.settings.move_down) === true) {
							var next_row;

							for(i = 0; steps === -1 ? true : i < steps; i++) {
								if(next_row === undefined) {
									if(current_row.next().length === 1) {
										next_row = current_row.next();
									}
									else {
										break;
									}
								}
								else {
									if(next_row.next().length === 1) {
										next_row = next_row.next();
									}
									else {
										break;
									}
								}
							}

							if(next_row !== undefined) {
								next_row.after(current_row);
							}
						}

						return false;
					});
				}
			});
		};

		// Initialize all repeatable field wrappers
		self.initialize(self);

		return self;
	};
})(jQuery);
