(function () {
    'use strict';

    var Scatterplot,
        Controls,
        app,

        DATA_PATH = 'data.csv',

        START_YEAR = 1950,
        END_YEAR   = 2015,

        TRANSITION_INTERVAL = 750,
        TRANSITION_DURATION = 750;

    Scatterplot = function (el) {
        // Our chart has two lifecycle functions, setup and update. The setup function is only ever
        // called right here; we'll use it to create anything that doesn't change depending on what
        // year is selected. The update function, however, is called every time the year changes.
        this.setup();
        this.update(app.globals.selected.year);
    };

    Scatterplot.prototype = {
        setup: function () {
            var chart = this;
        },

        update: function (year) {
            var chart = this;
        }
    };

    // Controls has two responsibilites in our simple app: it watches and updates the play/pause
    // button, and it updates the year label. In a more complex app, there could be many more
    // filters and options.
    Controls = function (el) {
        this.$el = $(el);

        this.setup();
        this.$el.find('#year-label').text(app.globals.selected.year);
        this.setAnimationState(app.globals.animating);
    };

    Controls.prototype = {
        setup: function () {
            function animationToggle(e) {
                if (!$(e.target).hasClass('disabled')) {
                    app.toggleAnimation();
                }
            }

            this.$el.find('#animate').click(animationToggle);
        },

        update: function (year) {
            var yearLabel = this.$el.find('#year-label');

            // Delay the label update so that it occurs at the apex of the chart transition.
            setTimeout(function() { yearLabel.text(year); }, TRANSITION_DURATION / 2);
        },

        setAnimationState: function (animating) {
            var toggle = this.$el.find('#animate');

            if (animating) {
                toggle.removeClass('paused');
                toggle.addClass('playing');
            } else {
                toggle.removeClass('playing');
                toggle.addClass('paused');
            }
        }
    };

    // This is where we start the dominos falling. After the page loads, D3 fetches the data from
    // the CSV and calls app.initialize with it. app.initialize then creates the Scatterplot and
    // Controls objects that we've defined above.
    $(function () {
        d3.csv(DATA_PATH, app.initialize);
    });

    app = {
        // These are placeholders that will be filled in by app.initialize.
        data: [],
        components: {
            controls: {},
            scatterplot: {}
        },

        // Here we define the global variables available to any components on the page. In order
        // to keep things tidy, only functions within this app object should ever modify these
        // variables, and we need to take care to ensure that any component that uses them is
        // appropriately updated. For tutorial purposes, we're passing the selected year to the
        // update function on the components, but each component could instead read the year from
        // here each time update is called. This is useful if there are many interacting filters
        // and options that each component may or may not need to know about.
        globals: {
            available: { years: d3.range(START_YEAR, END_YEAR + 1) },
            selected: { year: START_YEAR },
            animating: false
        },

        initialize: function (data) {
            // D3.csv will return everything as a string, so this function parses the numeric
            // columns in order to tell Javascript to treat them as numbers (it also switches
            // the column names to camelCase).
            app.data = data.map(function (d) {
                return {
                    country: d.country,
                    year: parseInt(d.year,10),
                    lifeExpectancy: parseFloat(d.life_expectancy),
                    fertility: parseFloat(d.total_fertility),
                    population: parseInt(d.population, 10),
                    continent: d.continent
                };
            });

            // It isn't strictly necessary to instantiate components in this way, as our simple app
            // only ever ever has one Controls and one Scatterplot. This pattern more useful when
            // there are multiple interacting components.
            app.components.scatterplot = new Scatterplot('#scatterplot');
            app.components.controls    = new Controls('#controls');

            // If we wanted to make our chart responsive, we could move the code that sizes things
            // from the setup function into a new resize function, which would be called each time
            // the window is resized. I typically use three lifecycle functions for each chart,
            // each of which calls any successive functions:
            // 1. setup (stuff that only ever happens once)
            // 2. resize (anything that's dependent on the size of the chart's parent element)
            // 3. update (stuff that changes anytime either the data or chart size does)
            // $(window).resize(app.resize);

            // Pressing the space bar will toggle the animation.
            $(window).keydown(function (e) {
                switch (e.which) {
                case 32: // space
                    app.toggleAnimation();
                    break;

                default:
                    return;
                }

                e.preventDefault();
            });

            // Hide the loading dialog and reveal the chart.
            $('#loading').fadeOut();
            $('#main').fadeIn();

            // Let's move!
            app.toggleAnimation();
        },

        resize: function () {
            for (var component in app.components) {
                if (app.components[component].resize) {
                    app.components[component].resize();
                }
            }
        },

        setYear: function (year) {
            app.globals.selected.year = year;
            for (var component in app.components) {
                if (app.components[component].update) {
                    app.components[component].update(year);
                }
            }
        },

        toggleAnimation: function (disable) {
            // To learn more about this method for handling animation, check out Paul Irish's blog:
            // http://paulirish.com/2011/requestanimationframe-for-smart-animating/

            var startTime = null;

            function frame(time) {
                if (app.globals.animating) {
                    if (!startTime) {
                        var availableYears = app.globals.available.years;
                        var currentIdx = availableYears.indexOf(app.globals.selected.year);
                        app.setYear(availableYears[(currentIdx + 1) % availableYears.length]);
                        startTime = time;
                    }

                    var progress = time - startTime;

                    if (progress <= TRANSITION_INTERVAL) {
                        window.requestAnimationFrame(frame);
                    } else {
                        startTime = null;
                        window.requestAnimationFrame(frame);
                    }
                }
            }

            if (app.globals.animating || disable) {
                app.globals.animating = false;
                $('body').removeClass('animating');
                if (app.components.controls.setAnimationState) {
                    app.components.controls.setAnimationState(false);
                }
            } else {
                app.globals.animating = true;
                window.requestAnimationFrame(frame);
                $('body').addClass('animating');
                if (app.components.controls.setAnimationState) {
                    app.components.controls.setAnimationState(true);
                }
            }
        }
    };
}());
