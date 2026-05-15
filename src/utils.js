export const Utils = {
    Functions: {
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
         * @description Find and load document element
         * @param {String} elemId Element id
         * @returns HTMLElement
         */
        load : function (elemId) {return document.getElementById(elemId);},
        /**
         * @description Add an event listener to html element
         * @param {HTMLElement} htmlElem 
         * @param {String} eventName 
         * @param {Function} eventFunction 
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
         * @description Execute the event from an element
         * @param {HTMLElement} element 
         * @param {String} event 
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