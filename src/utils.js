export const Utils = {
    Functions: {
        /**
         * Checks whether a value should be treated as absent by legacy UI code.
         *
         * @param {*} value Value to inspect.
         * @returns {boolean} True for null, undefined, and empty arrays.
         */
        empty : function (value) {
            if (value === null || value === undefined) {
                return true;

            } else if (Array.isArray(value)) {
                if (value.length > 0) {
                    return false;
                } else {
                    return true;
                }
            } else if (typeof value !== 'object') {
                return false;
            } else if (String(value) !== '') {
                return false;
            } else {
                return true;
            }
        },
        /**
         * Finds a document element by id.
         *
         * @param {string} elemId Element id.
         * @returns {HTMLElement|null}
         */
        load : function (elemId) {return document.getElementById(elemId);},
        /**
         * Adds an event listener with a legacy attachEvent fallback.
         *
         * @param {HTMLElement} htmlElem Element receiving the listener.
         * @param {string} eventName Event name without the "on" prefix.
         * @param {Function} eventFunction Callback to invoke.
         */
        AddEvent : function (htmlElem, eventName, eventFunction) {
            if(htmlElem.attachEvent) { //Internet Explorer
                htmlElem.attachEvent("on" + eventName, function() {eventFunction.call(htmlElem);});
            }
            else if(htmlElem.addEventListener) { //Firefox & company
                htmlElem.addEventListener(eventName, eventFunction, false);
            }
        },
        /**
         * Dispatches a DOM event from an element.
         *
         * @param {HTMLElement} element Element dispatching the event.
         * @param {string} event Event name without the "on" prefix.
         */
        FireEvent : function (element, event) {
            if (element.fireEvent) {element.fireEvent('on' + event);}
            else {
                var eventObj = document.createEvent('Events');
                eventObj.initEvent(event, true, false);
                element.dispatchEvent(eventObj);
            }
        },
    }
}
