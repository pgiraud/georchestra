/**
 * Provides a time input field with a time dropdown and automatic time validation.
 *
 * This field recognizes and uses JavaScript Date objects as its main {@link #value} type (only the time portion of the
 * date is used; the month/day/year are ignored). In addition, it recognizes string values which are parsed according to
 * the {@link #format} and/or {@link #altFormats} configs. These may be reconfigured to use time formats appropriate for
 * the user's locale.
 *
 * The field may be limited to a certain range of times by using the {@link #minValue} and {@link #maxValue} configs,
 * and the interval between time options in the dropdown can be changed with the {@link #increment} config.
 *
 * Example usage:
 *
 *     @example
 *     Ext.create('Ext.form.Panel', {
 *         title: 'Time Card',
 *         width: 300,
 *         bodyPadding: 10,
 *         renderTo: Ext.getBody(),
 *         items: [{
 *             xtype: 'timefield',
 *             name: 'in',
 *             fieldLabel: 'Time In',
 *             minValue: '6:00 AM',
 *             maxValue: '8:00 PM',
 *             increment: 30,
 *             anchor: '100%'
 *         }, {
 *             xtype: 'timefield',
 *             name: 'out',
 *             fieldLabel: 'Time Out',
 *             minValue: '6:00 AM',
 *             maxValue: '8:00 PM',
 *             increment: 30,
 *             anchor: '100%'
 *        }]
 *     });
 */
Ext.define('Ext.form.field.Time', {
    extend:'Ext.form.field.ComboBox',
    alias: 'widget.timefield',
    requires: ['Ext.form.field.Date', 'Ext.picker.Time', 'Ext.view.BoundListKeyNav', 'Ext.Date'],
    alternateClassName: ['Ext.form.TimeField', 'Ext.form.Time'],

    /**
     * @cfg {String} [triggerCls='x-form-time-trigger']
     * An additional CSS class used to style the trigger button. The trigger will always get the {@link #triggerBaseCls}
     * by default and triggerCls will be **appended** if specified.
     */
    triggerCls: Ext.baseCSSPrefix + 'form-time-trigger',

    /**
     * @cfg {Date/String} minValue
     * The minimum allowed time. Can be either a Javascript date object with a valid time value or a string time in a
     * valid format -- see {@link #format} and {@link #altFormats}.
     */

    /**
     * @cfg {Date/String} maxValue
     * The maximum allowed time. Can be either a Javascript date object with a valid time value or a string time in a
     * valid format -- see {@link #format} and {@link #altFormats}.
     */

    /**
     * @cfg {String} minText
     * The error text to display when the entered time is before {@link #minValue}.
     */
    //<locale>
    minText : "The time in this field must be equal to or after {0}",
    //</locale>

    /**
     * @cfg {String} maxText
     * The error text to display when the entered time is after {@link #maxValue}.
     */
    //<locale>
    maxText : "The time in this field must be equal to or before {0}",
    //</locale>

    /**
     * @cfg {String} invalidText
     * The error text to display when the time in the field is invalid.
     */
    //<locale>
    invalidText : "{0} is not a valid time",
    //</locale>

    /**
     * @cfg {String} [format=undefined]
     * The default time format string which can be overriden for localization support. The format must be valid
     * according to {@link Ext.Date#parse}.
     *
     * Defaults to `'g:i A'`, e.g., `'3:15 PM'`. For 24-hour time format try `'H:i'` instead.
     */
    //<locale>
    format : "g:i A",
    //</locale>

    /**
     * @cfg {String} [submitFormat=undefined]
     * The date format string which will be submitted to the server. The format must be valid according to
     * {@link Ext.Date#parse}.
     *
     * Defaults to {@link #format}.
     */
    //<locale>
    submitFormat: 'g:i A',
    //</locale>

    /**
     * @cfg {String} altFormats
     * Multiple date formats separated by "|" to try when parsing a user input value and it doesn't match the defined
     * format.
     */
    //<locale>
    altFormats : "g:ia|g:iA|g:i a|g:i A|h:i|g:i|H:i|ga|ha|gA|h a|g a|g A|gi|hi|gia|hia|g|H|gi a|hi a|giA|hiA|gi A|hi A",
    //</locale>

    /**
     * @cfg {Number} increment
     * The number of minutes between each time value in the list.
     */
    increment: 15,

    /**
     * @cfg {Number} pickerMaxHeight
     * The maximum height of the {@link Ext.picker.Time} dropdown.
     */
    pickerMaxHeight: 300,

    /**
     * @cfg {Boolean} selectOnTab
     * Whether the Tab key should select the currently highlighted item.
     */
    selectOnTab: true,

    /**
     * @private
     * This is the date to use when generating time values in the absence of either minValue
     * or maxValue.  Using the current date causes DST issues on DST boundary dates, so this is an
     * arbitrary "safe" date that can be any date aside from DST boundary dates.
     */
    initDate: '1/1/2008',
    initDateFormat: 'j/n/Y',
    
    ignoreSelection: 0,

    queryMode: 'local',

    displayField: 'disp',

    valueField: 'date',

    initComponent: function() {
        var me = this,
            min = me.minValue,
            max = me.maxValue;
        if (min) {
            me.setMinValue(min);
        }
        if (max) {
            me.setMaxValue(max);
        }
        this.callParent();
    },

    /**
     * Replaces any existing {@link #minValue} with the new time and refreshes the picker's range.
     * @param {Date/String} value The minimum time that can be selected
     */
    setMinValue: function(value) {
        var me = this,
            picker = me.picker;
        me.setLimit(value, true);
        if (picker) {
            picker.setMinValue(me.minValue);
        }
    },

    /**
     * Replaces any existing {@link #maxValue} with the new time and refreshes the picker's range.
     * @param {Date/String} value The maximum time that can be selected
     */
    setMaxValue: function(value) {
        var me = this,
            picker = me.picker;
        me.setLimit(value, false);
        if (picker) {
            picker.setMaxValue(me.maxValue);
        }
    },

    /**
     * @private
     * Updates either the min or max value. Converts the user's value into a Date object whose
     * year/month/day is set to the {@link #initDate} so that only the time fields are significant.
     */
    setLimit: function(value, isMin) {
        var me = this,
            d, val;
        if (Ext.isString(value)) {
            d = me.parseDate(value);
        }
        else if (Ext.isDate(value)) {
            d = value;
        }
        if (d) {
            val = Ext.Date.clearTime(new Date(me.initDate));
            val.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
            me[isMin ? 'minValue' : 'maxValue'] = val;
        }
    },

    rawToValue: function(rawValue) {
        return this.parseDate(rawValue) || rawValue || null;
    },

    valueToRaw: function(value) {
        return this.formatDate(this.parseDate(value));
    },

    /**
     * Runs all of Time's validations and returns an array of any errors. Note that this first runs Text's validations,
     * so the returned array is an amalgamation of all field errors. The additional validation checks are testing that
     * the time format is valid, that the chosen time is within the {@link #minValue} and {@link #maxValue} constraints
     * set.
     * @param {Object} [value] The value to get errors for (defaults to the current field value)
     * @return {String[]} All validation errors for this field
     */
    getErrors: function(value) {
        var me = this,
            format = Ext.String.format,
            errors = me.callParent(arguments),
            minValue = me.minValue,
            maxValue = me.maxValue,
            date;

        value = me.formatDate(value || me.processRawValue(me.getRawValue()));

        if (value === null || value.length < 1) { // if it's blank and textfield didn't flag it then it's valid
             return errors;
        }

        date = me.parseDate(value);
        if (!date) {
            errors.push(format(me.invalidText, value, me.format));
            return errors;
        }

        if (minValue && date < minValue) {
            errors.push(format(me.minText, me.formatDate(minValue)));
        }

        if (maxValue && date > maxValue) {
            errors.push(format(me.maxText, me.formatDate(maxValue)));
        }

        return errors;
    },

    formatDate: function() {
        return Ext.form.field.Date.prototype.formatDate.apply(this, arguments);
    },

    /**
     * @private
     * Parses an input value into a valid Date object.
     * @param {String/Date} value
     */
    parseDate: function(value) {
        if (!value || Ext.isDate(value)) {
            return value;
        }

        var me = this,
            val = me.safeParse(value, me.format),
            altFormats = me.altFormats,
            altFormatsArray = me.altFormatsArray,
            i = 0,
            len;

        if (!val && altFormats) {
            altFormatsArray = altFormatsArray || altFormats.split('|');
            len = altFormatsArray.length;
            for (; i < len && !val; ++i) {
                val = me.safeParse(value, altFormatsArray[i]);
            }
        }
        return val;
    },

    safeParse: function(value, format){
        var me = this,
            utilDate = Ext.Date,
            parsedDate,
            result = null;

        if (utilDate.formatContainsDateInfo(format)) {
            // assume we've been given a full date
            result = utilDate.parse(value, format);
        } else {
            // Use our initial safe date
            parsedDate = utilDate.parse(me.initDate + ' ' + value, me.initDateFormat + ' ' + format);
            if (parsedDate) {
                result = parsedDate;
            }
        }
        return result;
    },

    // @private
    getSubmitValue: function() {
        var me = this,
            format = me.submitFormat || me.format,
            value = me.getValue();

        return value ? Ext.Date.format(value, format) : null;
    },

    /**
     * @private
     * Creates the {@link Ext.picker.Time}
     */
    createPicker: function() {
        var me = this,
            picker;

        me.listConfig = Ext.apply({
            xtype: 'timepicker',
            selModel: {
                mode: 'SINGLE'
            },
            cls: undefined,
            minValue: me.minValue,
            maxValue: me.maxValue,
            increment: me.increment,
            format: me.format,
            maxHeight: me.pickerMaxHeight
        }, me.listConfig);
        picker = me.callParent();
        me.store = picker.store;
        return picker
    },
    
    onItemClick: function(picker, record){
        // The selection change events won't fire when clicking on the selected element. Detect it here.
        var me = this,
            selected = picker.getSelectionModel().getSelection();

        if (selected.length > 0) {
            selected = selected[0];
            if (selected && Ext.Date.isEqual(record.get('date'), selected.get('date'))) {
                me.collapse();
            }
        }
    },

    /**
     * @private
     * Clears the highlighted item in the picker on change.
     * This prevents the highlighted item from being selected instead of the custom typed in value when the tab key is pressed.
     */
    onChange: function() {
        var me = this,
            picker = me.picker;

        me.callParent(arguments);
        if(picker) {
            picker.clearHighlight();
        }
    },

    /**
     * @private
     * Handles a time being selected from the Time picker.
     */
    onListSelectionChange: function(list, recordArray) {
        var me = this,
            record = recordArray[0],
            val = record ? record.get('date') : null;
            
        if (!me.ignoreSelection) {
            me.skipSync = true;
            me.setValue(val);
            me.skipSync = false;
            me.fireEvent('select', me, val);
            me.picker.clearHighlight();
            me.collapse();
            me.inputEl.focus();
        }
    },
    
    /**
     * @private 
     * Synchronizes the selection in the picker to match the current value
     */
    syncSelection: function() {
        var me = this,
            picker = me.picker,
            toSelect,
            selModel,
            value,
            data, d, dLen, rec;
            
        if (picker && !me.skipSync) {
            picker.clearHighlight();
            value = me.getValue();
            selModel = picker.getSelectionModel();
            // Update the selection to match
            me.ignoreSelection++;
            if (value === null) {
                selModel.deselectAll();
            } else if(Ext.isDate(value)) {
                // find value, select it
                data = picker.store.data.items;
                dLen = data.length;

                for (d = 0; d < dLen; d++) {
                    rec = data[d];

                    if (Ext.Date.isEqual(rec.get('date'), value)) {
                       toSelect = rec;
                       break;
                   }
                }

                selModel.select(toSelect);
            }
            me.ignoreSelection--;
        }
    },

    postBlur: function() {
        var me = this;

        me.callParent(arguments);
        me.setRawValue(me.formatDate(me.getValue()));
    },

    getValue: function() {
        var val = this.callParent(arguments);
        return this.parseDate(val);
    }
});