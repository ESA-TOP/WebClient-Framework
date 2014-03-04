(function() {
	'use strict';

	var root = this;

	root.define([
			'backbone',
			'globals',
			'regions/DialogRegion', 'regions/UIRegion',
			'layouts/LayerControlLayout',
			'layouts/ToolControlLayout',
			'core/SplitView/WindowView',
			'communicator',
			'jquery', 'backbone.marionette',
			'controller/ContentController',
			'controller/DownloadController',
			'controller/SelectionManagerController',
			'controller/LoadingController'
		],

		function(Backbone, globals, DialogRegion,
			UIRegion, LayerControlLayout, ToolControlLayout, WindowView, Communicator) {

		var Application = Backbone.Marionette.Application.extend({
			initialize: function(options) {
			},

			configure: function(config) {

				var v = {}; //views
				var m = {};	//models
				var t = {};	//templates

				// Application regions are loaded and added to the Marionette Application
				_.each(config.regions, function(region) {
					var obj = {};
					obj[region.name] = "#" + region.name;
					this.addRegions(obj);
					//console.log("Added region " + obj[region.name]);
				}, this);

				//Load all configured views
				_.each(config.views, function(viewDef) {
					var View = require(viewDef);
					$.extend(v, View);
				}, this);

				//Load all configured models
				_.each(config.models, function(modelDef) {
					var Model = require(modelDef);
					$.extend(m, Model);
				}, this);

				//Load all configured templates
				_.each(config.templates, function(tmplDef) {
					var Tmpl = require(tmplDef.template);
					t[tmplDef.id] = Tmpl;
				}, this);


				//Map attributes are loaded and added to the global map model
				globals.objects.add('mapmodel', new m.MapModel({
						visualizationLibs : config.mapConfig.visualizationLibs,
						center: config.mapConfig.center,
						zoom: config.mapConfig.zoom
					})
				);

				//Base Layers are loaded and added to the global collection
				_.each(config.mapConfig.baseLayers, function(baselayer) {

					globals.baseLayers.add(
						new m.LayerModel({
							name: baselayer.name,
							visible: baselayer.visible,
							view: {
								id : baselayer.id,
								urls : baselayer.urls,
								protocol: baselayer.protocol,
								projection: baselayer.projection,
								attribution: baselayer.attribution,
								matrixSet: baselayer.matrixSet,
								style: baselayer.style,
								format: baselayer.format,
								resolutions: baselayer.resolutions,
								maxExtent: baselayer.maxExtent,
								gutter: baselayer.gutter,
								buffer: baselayer.buffer,
								units: baselayer.units,
								transitionEffect: baselayer.transitionEffect,
								isphericalMercator: baselayer.isphericalMercator,
								isBaseLayer: true,
								wrapDateLine: baselayer.wrapDateLine,
								zoomOffset: baselayer.zoomOffset,
									//time: baselayer.time // Is set in TimeSliderView on time change.
							}
						})
					);
					console.log("Added baselayer " + baselayer.id );
				}, this);

				//Productsare loaded and added to the global collection
                var ordinal = 0;
				_.each(config.mapConfig.products, function(products) {
					globals.products.add(
						new m.LayerModel({
							name: products.name,
							visible: products.visible,
                            ordinal: ordinal,
							timeSlider: products.timeSlider,
							// Default to WMS if no protocol is defined
							timeSliderProtocol: (products.timeSliderProtocol) ? products.timeSliderProtocol : "WMS",
							color: products.color,
							//time: products.time, // Is set in TimeSliderView on time change.
								opacity: 1,
								views: products.views,
								view: {isBaseLayer: false},
								download: {
									id: products.download.id,
									protocol: products.download.protocol,
									url: products.download.url
								}
							})
					);
					console.log("Added product " + products.name );
				}, this);

				//Overlays are loaded and added to the global collection
				_.each(config.mapConfig.overlays, function(overlay) {

						globals.overlays.add(
							new m.LayerModel({
								name: overlay.name,
								visible: overlay.visible,
								ordinal: ordinal,
								view: {
									id: overlay.id,
									urls: overlay.urls,
									protocol: overlay.protocol,
									projection: overlay.projection,
									attribution: overlay.attribution,
									matrixSet: overlay.matrixSet,
									style: overlay.style,
									format: overlay.format,
									resolutions: overlay.resolutions,
									maxExtent: overlay.maxExtent,
									gutter: overlay.gutter,
									buffer: overlay.buffer,
									units: overlay.units,
									transitionEffect: overlay.transitionEffect,
									isphericalMercator: overlay.isphericalMercator,
									isBaseLayer: false,
									wrapDateLine: overlay.wrapDateLine,
									zoomOffset: overlay.zoomOffset,
									//time: overlay.time // Is set in TimeSliderView on time change.
								}
							})
						);
						console.log("Added overlay " + overlay.id);
					}, this);



				// If Navigation Bar is set in configuration go trhough the 
				// defined elements creating a item collection to rendered
				// by the marionette collection view
				if (config.navBarConfig) {

					var navBarItemCollection = new m.NavBarCollection;

					_.each(config.navBarConfig.items, function(list_item){
						navBarItemCollection.add(
							new m.NavBarItemModel({
								name:list_item.name,
                                icon:list_item.icon,
								eventToRaise:list_item.eventToRaise
							}));
					}, this);

					this.topBar.show(new v.NavBarCollectionView(
						{template: t.NavBar({
							title: config.navBarConfig.title,
							url: config.navBarConfig.url}),
						className:"navbar navbar-inverse navbar-fixed-top not-selectable",
						itemView: v.NavBarItemView, tag: "div",
						collection: navBarItemCollection}));

				};

				// Added region to test combination of backbone
				// functionality combined with jQuery UI
				this.addRegions({dialogRegion: DialogRegion.extend({el: "#viewContent"})});
				this.DialogContentView = new v.ContentView({
					template: {type: 'handlebars', template: t.Info},
                    id: "about",
                    className: "modal fade",
                    attributes: {
                        role: "dialog",
                        tabindex: "-1",
                        "aria-labelledby": "about-title",
                        "aria-hidden": true,
                        "data-keyboard": true,
                        "data-backdrop": "static"
                    }
				});

				// Create the views - these are Marionette.CollectionViews that render ItemViews
                this.baseLayerView = new v.BaseLayerSelectionView({
                	collection:globals.baseLayers,
                	itemView: v.LayerItemView.extend({
                		template: {
                			type:'handlebars',
                			template: t.BulletLayer},
                		className: "radio"
                	})
                });

                this.productsView = new v.LayerSelectionView({
                	collection:globals.products,
                	itemView: v.LayerItemView.extend({
                		template: {
                			type:'handlebars',
                			template: t.CheckBoxLayer},
                		className: "sortable-layer"
                	}),
                	className: "sortable"
                });

                this.overlaysView = new v.BaseLayerSelectionView({
                	collection: globals.overlays,
                	itemView: v.LayerItemView.extend({
                		template: {
                			type: 'handlebars',
                			template: t.CheckBoxOverlayLayer},
                		className: "checkbox"
                	}),
                	className: "check"
                });

                // Create layout that will hold the child views
                this.layout = new LayerControlLayout();


                // Define collection of selection tools
                var selectionToolsCollection = new m.ToolCollection();
                _.each(config.selectionTools, function(selTool) {
					selectionToolsCollection.add(
							new m.ToolModel({
								id: selTool.id,
								description: selTool.description,
								icon:selTool.icon,
								enabled: true,
								active: false,
								type: "selection"
							}));
				}, this);

                // Define collection of visualization tools
                var visualizationToolsCollection = new m.ToolCollection();
                _.each(config.visualizationTools, function(visTool) {
					visualizationToolsCollection.add(
							new m.ToolModel({
								id: visTool.id,
								eventToRaise: visTool.eventToRaise,
								description: visTool.description,
								icon:visTool.icon,
								enabled: visTool.enabled,
								active: visTool.active,
								type: "tool"
							}));
				}, this);

				// Define collection of visualization modes
                var visualizationModesCollection = new m.ToolCollection();
                _.each(config.visualizationModes, function(visMode) {
                    visualizationModesCollection.add(
                        new m.ToolModel({
                            id: visMode.id,
                            eventToRaise: visMode.eventToRaise,
                            description: visMode.description,
                            icon: visMode.icon,
                            enabled: visMode.enabled,
                            active: visMode.active,
                            type: "vis_mode"
                        }));
                }, this);	
                
                // Create Collection Views to hold set of views for selection tools
                this.visualizationToolsView = new v.ToolSelectionView({
                	collection:visualizationToolsCollection,
                	itemView: v.ToolItemView.extend({
                		template: {
                			type:'handlebars',
                			template: t.ToolIcon}
                	})
                });

                // Create Collection Views to hold set of views for visualization tools
                this.selectionToolsView = new v.ToolSelectionView({
                	collection:selectionToolsCollection,
                	itemView: v.ToolItemView.extend({
                		template: {
                			type:'handlebars',
                			template: t.ToolIcon}
                	})
                });


                // Create Collection Views to hold set of views for visualization modes
                this.visualizationModesView = new v.ToolSelectionView({
                    collection: visualizationModesCollection,
                    itemView: v.ToolItemView.extend({
                        template: {
                            type: 'handlebars',
                            template: t.ToolIcon
                        }
                    })
                });



                // Create layout to hold collection views
                this.toolLayout = new ToolControlLayout();

                // Instance timeslider view
                this.timeSliderView = new v.TimeSliderView(config.timeSlider);			
			},

			// The GUI is setup after the application is started. Therefore all modules
			// are already registered and can be requested to populate the GUI.
			setupGui: function() {

				// Starts the SplitView module and registers it with the Communicator.
				this.module('SplitView').start();
				var splitview = this.module('SplitView').createController();
				this.main.show(splitview.getView());

				splitview.setSinglescreen();

				// Show Timsliderview after creating modules to
				// set the selected time correctly to the products
				this.bottomBar.show(this.timeSliderView);

			    // Add a trigger for ajax calls in order to display loading state
                // in mouse cursor to give feedback to the user the client is busy
                $(document).ajaxStart(function() {
                  	Communicator.mediator.trigger("progress:change", true);
                });

                $(document).ajaxStop(function() {
                  	Communicator.mediator.trigger("progress:change", false);
                });

                $(document).ajaxError(function( event, request, settings ) {
                        $("#error-messages").append(
                                  '<div class="alert alert-warning alert-danger">'+
                                  '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                                  '<strong>Warning!</strong> Error response on HTTP ' + settings.type + ' to '+ settings.url.split("?")[0] +
                                '</div>'
                        );
                });

                // Remove loading screen when this point is reached in the script
                $('#loadscreen').remove();

			}



		});

		return new Application();
	});
}).call( this );