/* global Metro, Utils, Component, METRO_LOCALE */
var DatePickerDefaultConfig = {
    datepickerDeferred: 0,
    gmt: 0,
    format: "%Y-%m-%d",
    inputFormat: null,
    locale: METRO_LOCALE,
    value: null,
    distance: 3,
    month: true,
    day: true,
    year: true,
    minYear: null,
    maxYear: null,
    scrollSpeed: 4,
    copyInlineStyles: false,
    clsPicker: "",
    clsPart: "",
    clsMonth: "",
    clsDay: "",
    clsYear: "",
    okButtonIcon: "<span class='default-icon-check'></span>",
    cancelButtonIcon: "<span class='default-icon-cross'></span>",
    onSet: Metro.noop,
    onOpen: Metro.noop,
    onClose: Metro.noop,
    onScroll: Metro.noop,
    onDatePickerCreate: Metro.noop
};

Metro.datePickerSetup = function (options) {
    DatePickerDefaultConfig = $.extend({}, DatePickerDefaultConfig, options);
};

if (typeof window["metroDatePickerSetup"] !== undefined) {
    Metro.datePickerSetup(window["metroDatePickerSetup"]);
}

Component('date-picker', {
    init: function( options, elem ) {
        this._super(elem, options, DatePickerDefaultConfig);

        this.picker = null;
        this.isOpen = false;
        this.value = new Date();
        this.locale = Metro.locales[this.options.locale]['calendar'];
        this.offset = (new Date()).getTimezoneOffset() / 60 + 1;
        this.listTimer = {
            day: null,
            month: null,
            year: null
        };

        Metro.createExec(this);

        return this;
    },

    _create: function(){
        var element = this.element, o = this.options;

        Metro.checkRuntime(element, this.name);

        if (o.distance < 1) {
            o.distance = 1;
        }

        if (Utils.isValue(element.val())) {
            o.value = element.val();
        }

        if (Utils.isValue(o.value)) {
            if (Utils.isValue(o.inputFormat)) {
                this.value = (""+o.value).toDate(o.inputFormat);
            } else {
                if (Utils.isDate(o.value)) {
                    this.value = new Date(o.value);
                }
            }
        }

        // this.value.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        // this.value = this.value.addHours(this.offset);

        if (Metro.locales[o.locale] === undefined) {
            o.locale = METRO_LOCALE;
        }

        this.locale = Metro.locales[o.locale]['calendar'];

        if (o.minYear === null) {
            o.minYear = (new Date()).getFullYear() - 100;
        }

        if (o.maxYear === null) {
            o.maxYear = (new Date()).getFullYear() + 100;
        }

        this._createStructure();
        this._createEvents();
        this._set();

        Utils.exec(o.onDatePickerCreate, [element]);
        element.fire("datepickercreate");
    },

    _createStructure: function(){
        var element = this.element, o = this.options;
        var picker, month, day, year, i, j;
        var dateWrapper, selectWrapper, selectBlock, actionBlock;

        var prev = element.prev();
        var parent = element.parent();
        var id = Utils.elementId("datepicker");

        picker = $("<div>").attr("id", id).addClass("wheel-picker date-picker " + element[0].className).addClass(o.clsPicker);

        if (prev.length === 0) {
            parent.prepend(picker);
        } else {
            picker.insertAfter(prev);
        }

        element.appendTo(picker);


        dateWrapper = $("<div>").addClass("date-wrapper").appendTo(picker);

        if (o.month === true) {
            month = $("<div>").addClass("month").addClass(o.clsPart).addClass(o.clsMonth).appendTo(dateWrapper);
        }
        if (o.day === true) {
            day = $("<div>").addClass("day").addClass(o.clsPart).addClass(o.clsDay).appendTo(dateWrapper);
        }
        if (o.year === true) {
            year = $("<div>").addClass("year").addClass(o.clsPart).addClass(o.clsYear).appendTo(dateWrapper);
        }

        selectWrapper = $("<div>").addClass("select-wrapper").appendTo(picker);

        selectBlock = $("<div>").addClass("select-block").appendTo(selectWrapper);

        if (o.month === true) {
            month = $("<ul>").addClass("sel-month").appendTo(selectBlock);
            for (i = 0; i < o.distance; i++) $("<li>").html("&nbsp;").data("value", -1).appendTo(month);
            for (i = 0; i < 12; i++) {
                $("<li>").addClass("js-month-"+i+" js-month-real-"+this.locale['months'][i].toLowerCase()).html(this.locale['months'][i]).data("value", i).appendTo(month);
            }
            for (i = 0; i < o.distance; i++) $("<li>").html("&nbsp;").data("value", -1).appendTo(month);
        }

        if (o.day === true) {
            day = $("<ul>").addClass("sel-day").appendTo(selectBlock);
            for (i = 0; i < o.distance; i++) $("<li>").html("&nbsp;").data("value", -1).appendTo(day);
            for (i = 0; i < 31; i++) {
                $("<li>").addClass("js-day-"+i+" js-day-real-"+(i+1)).html(i + 1).data("value", i + 1).appendTo(day);
            }
            for (i = 0; i < o.distance; i++) $("<li>").html("&nbsp;").data("value", -1).appendTo(day);
        }

        if (o.year === true) {
            year = $("<ul>").addClass("sel-year").appendTo(selectBlock);
            for (i = 0; i < o.distance; i++) $("<li>").html("&nbsp;").data("value", -1).appendTo(year);
            for (i = o.minYear, j = 0; i <= o.maxYear; i++, j++) {
                $("<li>").addClass("js-year-"+ j + " js-year-real-" + i).html(i).data("value", i).appendTo(year);
            }
            for (i = 0; i < o.distance; i++) $("<li>").html("&nbsp;").data("value", -1).appendTo(year);
        }

        selectBlock.height((o.distance * 2 + 1) * 40);

        actionBlock = $("<div>").addClass("action-block").appendTo(selectWrapper);
        $("<button>").attr("type", "button").addClass("button action-ok").html(o.okButtonIcon).appendTo(actionBlock);
        $("<button>").attr("type", "button").addClass("button action-cancel").html(o.cancelButtonIcon).appendTo(actionBlock);


        element[0].className = '';
        if (o.copyInlineStyles === true) {
            for (i = 0; i < element[0].style.length; i++) {
                picker.css(element[0].style[i], element.css(element[0].style[i]));
            }
        }

        this.picker = picker;
    },

    _createEvents: function(){
        var that = this, o = this.options;
        var picker = this.picker;

        picker.on(Metro.events.start, ".select-block ul", function(e){

            if (e.changedTouches) {
                return ;
            }

            var target = this;
            var pageY = Utils.pageXY(e).y;

            $(document).on(Metro.events.move, function(e){

                target.scrollTop -= o.scrollSpeed * (pageY  > Utils.pageXY(e).y ? -1 : 1);

                pageY = Utils.pageXY(e).y;
            }, {ns: picker.attr("id")});

            $(document).on(Metro.events.stop, function(){
                $(document).off(Metro.events.move, {ns: picker.attr("id")});
                $(document).off(Metro.events.stop, {ns: picker.attr("id")});
            }, {ns: picker.attr("id")});
        });

        picker.on(Metro.events.click, function(e){
            if (that.isOpen === false) that.open();
            e.stopPropagation();
        });

        picker.on(Metro.events.click, ".action-ok", function(e){
            var m, d, y;
            var sm = picker.find(".sel-month li.active"),
                sd = picker.find(".sel-day li.active"),
                sy = picker.find(".sel-year li.active");

            m = sm.length === 0 ? that.value.getMonth() : sm.data("value");
            d = sd.length === 0 ? that.value.getDate() : sd.data("value");
            y = sy.length === 0 ? that.value.getFullYear() : sy.data("value");

            that.value = new Date(y, m, d);
            that._correct();
            that._set();

            that.close();
            e.stopPropagation();
        });

        picker.on(Metro.events.click, ".action-cancel", function(e){
            that.close();
            e.stopPropagation();
        });

        var scrollLatency = 150;
        $.each(["month", "day", "year"], function(){
            var part = this, list = picker.find(".sel-"+part);

            list.on("scroll", function(){
                if (that.isOpen) {
                    if (that.listTimer[part]) {
                        clearTimeout(that.listTimer[part]);
                        that.listTimer[part] = null;
                    }

                    if (!that.listTimer[part]) that.listTimer[part] = setTimeout(function () {

                        var target, targetElement, scrollTop;

                        that.listTimer[part] = null;

                        target = Math.round((Math.ceil(list.scrollTop()) / 40));

                        targetElement = list.find(".js-" + part + "-" + target);
                        scrollTop = targetElement.position().top - (o.distance * 40);

                        list.find(".active").removeClass("active");

                        list[0].scrollTop = scrollTop;
                        targetElement.addClass("active");
                        Utils.exec(o.onScroll, [targetElement, list, picker], list[0]);

                    }, scrollLatency);
                }
            })
        });
    },

    _correct: function(){
        var m = this.value.getMonth(),
            d = this.value.getDate(),
            y = this.value.getFullYear();

        this.value = new Date(y, m, d);
    },

    _set: function(){
        var element = this.element, o = this.options;
        var picker = this.picker;
        var m = this.locale['months'][this.value.getMonth()],
            d = this.value.getDate(),
            y = this.value.getFullYear();

        if (o.month === true) {
            picker.find(".month").html(m);
        }
        if (o.day === true) {
            picker.find(".day").html(d);
        }
        if (o.year === true) {
            picker.find(".year").html(y);
        }

        element.val(this.value.format(o.format, o.locale)).trigger("change");

        Utils.exec(o.onSet, [this.value, element.val(), element, picker], element[0]);
        element.fire("set", {
            value: this.value
        });
    },

    open: function(){
        var element = this.element, o = this.options;
        var picker = this.picker;
        var m = this.value.getMonth(), d = this.value.getDate() - 1, y = this.value.getFullYear();
        var m_list, d_list, y_list;
        var select_wrapper = picker.find(".select-wrapper");
        var select_wrapper_in_viewport, select_wrapper_rect;

        select_wrapper.parent().removeClass("for-top for-bottom");
        select_wrapper.show(0);
        picker.find("li").removeClass("active");

        select_wrapper_in_viewport = Utils.inViewport(select_wrapper[0]);
        select_wrapper_rect = Utils.rect(select_wrapper[0]);

        if (!select_wrapper_in_viewport && select_wrapper_rect.top > 0) {
            select_wrapper.parent().addClass("for-bottom");
        }

        if (!select_wrapper_in_viewport && select_wrapper_rect.top < 0) {
            select_wrapper.parent().addClass("for-top");
        }

        if (o.month === true) {
            m_list = picker.find(".sel-month");
            m_list
                .scrollTop(0)
                .animate({
                    draw: {
                        scrollTop: m_list.find("li.js-month-" + m).addClass("active").position().top - (40 * o.distance)
                    },
                    dur: 100
                });
        }
        if (o.day === true) {
            d_list = picker.find(".sel-day");
            d_list
                .scrollTop(0)
                .animate({
                    draw: {
                        scrollTop: d_list.find("li.js-day-" + d).addClass("active").position().top - (40 * o.distance)
                    },
                    dur: 100
                });
        }
        if (o.year === true) {
            y_list = picker.find(".sel-year");
            y_list
                .scrollTop(0)
                .animate({
                    draw: {
                        scrollTop: y_list.find("li.js-year-real-" + y).addClass("active").position().top - (40 * o.distance)
                    },
                    dur: 100
                });
        }

        this.isOpen = true;

        Utils.exec(o.onOpen, [this.value, element, picker], element[0]);
        element.fire("open", {
            value: this.value
        });
    },

    close: function(){
        var picker = this.picker, o = this.options, element = this.element;
        picker.find(".select-wrapper").hide(0);
        this.isOpen = false;
        Utils.exec(o.onClose, [this.value, element, picker], element[0]);
        element.fire("close", {
            value: this.value
        });
    },

    val: function(value){
        var o = this.options;

        if (!Utils.isValue(value)) {
            return this.element.val();
        }

        if (Utils.isValue(o.inputFormat)) {
            this.value = (""+value).toDate(o.inputFormat);
        } else {
            this.value = new Date(value);
        }

        // this.value = (new Date(t)).addHours(this.offset);
        this._set();
    },

    date: function(t){
        if (t === undefined) {
            return this.value;
        }

        try {
            this.value = new Date(t.format("%Y-%m-%d"));
            this._set();
        } catch (e) {
            return false;
        }
    },

    i18n: function(locale){
        var element = this.element, o = this.options;
        var month, i;

        o.locale = locale ? locale : element.attr("data-locale");
        this.locale = Metro.locales[o.locale]['calendar'];

        if (o.month === true) {
            month =  element.closest(".date-picker").find(".sel-month").html("");
            for (i = 0; i < o.distance; i++) $("<li>").html("&nbsp;").data("value", -1).appendTo(month);
            for (i = 0; i < 12; i++) {
                $("<li>").addClass("js-month-"+i+" js-month-real-"+this.locale['months'][i].toLowerCase()).html(this.locale['months'][i]).data("value", i).appendTo(month);
            }
            for (i = 0; i < o.distance; i++) $("<li>").html("&nbsp;").data("value", -1).appendTo(month);
        }

        this._set();
    },

    changeAttribute: function(attributeName){
        var that = this;

        function changeValue() {
            that.val(that.element.attr("data-value"));
        }

        function changeLocale() {
            that.i18n(that.element.attr("data-locale"));
        }

        function changeFormat() {
            that.options.format = that.element.attr("data-format");
            // that.element.val(that.value.format(that.options.format, that.options.locale)).trigger("change");
            that._set();
        }

        switch (attributeName) {
            case "data-value": changeValue(); break;
            case "data-locale": changeLocale(); break;
            case "data-format": changeFormat(); break;
        }
    },

    destroy: function(){
        var element = this.element, picker = this.picker;

        $.each(["moth", "day", "year"], function(){
            picker.find(".sel-"+this).off("scroll");
        });

        picker.off(Metro.events.start, ".select-block ul");
        picker.off(Metro.events.click);
        picker.off(Metro.events.click, ".action-ok");
        picker.off(Metro.events.click, ".action-cancel");

        return element;
    }
});

$(document).on(Metro.events.click, function(){
    $.each($(".date-picker"), function(){
        $(this).find("input").each(function(){
            Metro.getPlugin(this, "datepicker").close();
        });
    });
});