
function checkDateInput() {
    var input = document.createElement('input');
    input.setAttribute('type','date');

    var notADateValue = 'not-a-date';
    input.setAttribute('value', notADateValue); 

    return (input.value !== notADateValue);
}
if (!checkDateInput()) {
    $(".time-selector-overlay input").bootstrapMaterialDatePicker({ weekStart : 0, time: false });
}