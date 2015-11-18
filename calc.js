function loadPreference () {
	savedPreference = sessionStorage.getItem("arterialbloodgas.com");
	unitPreference = JSON.parse(savedPreference);
	if (unitPreference == [".SI-toggle"]) {
		unitToggle(".SI-toggle",".US-toggle",'.SI','.US',0.133322368,0.01,"kPa");
    }
};

function rememberPreference (unit) {
	unitPreference = JSON.stringify(unit);
	sessionStorage.setItem("arterialbloodgas.com",unitPreference);
};

//declaring disorders
var respiratoryAcidosis = "Respiratory acidosis";
var respiratoryAlkalosis = "Respiratory alkalosis";
var metabolicAcidosis = "Metabolic acidosis <button type='button' class='checkanion'>Check Anion Gap</button>";
var metabolicAlkalosis = "Metabolic alkalosis";
var noDisorder = "None";

//initial variables
var conversionFactor = 1;
var primary = "";
var secondary = "";
var onset = "";
var error_present = false;

//Toggle between US and SI units
function unitToggle (thisUnitToggle, otherUnitToggle,thisUnitClass,otherUnitClass,conversionRate,stepDecimal,unitSuffix) {
    $(thisUnitToggle).addClass('active');
    $(thisUnitToggle).css("background-color","#247D70");
    $(thisUnitClass).show();
    $(otherUnitClass).hide();
    $(otherUnitToggle).removeClass('active');
    $(otherUnitToggle).css("background-color", "#34B3A0");
    $('#PaCO2, #PaO2').attr("step", stepDecimal);
    units = unitSuffix;
    conversionFactor = conversionRate;
    rememberPreference(thisUnitToggle);
};

//Get initial values on form submission
function getStandardisedValues(analyte,requiresConversion) {
    inputField = "input[name=" + analyte + "]";
    analyteValue = parseFloat($(inputField).val());
    if (requiresConversion) {
        analyteValue /= conversionFactor;
    }
    return analyteValue.toFixed(1);
};

//Respiratory disorder onset
function respiratoryOnset(calculatedH,PaCO2PercentageChange) {
    var onsetRatio = (Math.abs((40 - calculatedH)/40))/(PaCO2PercentageChange);
    if (onsetRatio < 0.3) {
        return "Chronic";
    } else if (onsetRatio > 0.8) {
        return "Acute";
    } else {
        return "Acute on chronic";
    }
};

//Respiratory acidosis compensation calculation
function respiratoryAcidosisCompensation(onset,PaCO2Change,HCO3) {
    if (onset === "Chronic") {
        var expectedHCO3 = Math.round(3.5 * PaCO2Change / 10 + 24);
        if (HCO3 > expectedHCO3) {
            return metabolicAlkalosis;
        } else if (HCO3 < expectedHCO3) {
            return metabolicAcidosis;
        } else {
            return noDisorder;
        }
    } else {
        var expectedHCO3 = Math.round(PaCO2Change / 10 + 24);
        if (HCO3 > expectedHCO3 + 3) {
            return metabolicAlkalosis;
        } else if (HCO3 < expectedHCO3 - 3) {
            return metabolicAcidosis;
        } else {
            return noDisorder;
        }
    }
};

//Respiratory alkalosis compensation calculation
function respiratoryAlkalosisCompensation(onset,PaCO2Change,HCO3) {
    if (onset === "Chronic") {
        var expectedHCO3 =  Math.round(PaCO2Change / 10);
        var expectedHCO3High = 24 - expectedHCO3 * 5;
        var expectedHCO3Low = 24 - expectedHCO3 * 7;
        if (HCO3 > expectedHCO3High) {
            return metabolicAlkalosis;
        } else if (HCO3 < expectedHCO3Low) {
            return metabolicAcidosis;
        } else {
            return noDisorder;
        }
    } else {
        var expectedHCO3 = Math.round(24 - 2 * PaCO2Change / 10);
        if (HCO3 > expectedHCO3) {
            return metabolicAlkalosis;
        } else if (HCO3 < expectedHCO3) {
            return metabolicAcidosis;
        } else {
            return noDisorder;
        }
    }
};

//Metabolic acidosis compensation calculation
function metabolicAcidosisCompensation(HCO3,PaCO2) {
    var expectedPaCO2 = Math.round((1.5 * HCO3) + 8);
    if (PaCO2 > (expectedPaCO2 + 2)) {
        return respiratoryAcidosis;
    } else if (PaCO2 < (expectedPaCO2 - 2)) {
        return respiratoryAlkalosis;
    } else {
        return noDisorder;
    }
};

//metabolic alkalosis compensation calculation
function metabolicAlkalosisCompensation(HCO3Change,PaCO2) {
    var expectedPaCO2 = Math.round(40 + 0.6 * HCO3Change);
    if (PaCO2 > expectedPaCO2) {
        return respiratoryAcidosis;
    } else if (PaCO2 < expectedPaCO2) {
        return respiratoryAlkalosis;
    } else {
        return noDisorder;
    }
};

//ABG values lead to error
function error() {
    error_present = true;
    return "Unable to ascertain a primary disorder. Please reconsider the validity of your sample.";
};
//we position and size modal according to window size
function setAnionGapModalPosition() {
	$('.aniongap-modal').css("top", ( $(window).height() - $('.aniongap-modal').height() ) * 0.3 );
	width = setAnionGapModalWidth($(window).width());
	$('.aniongap-modal').width(width);
	$('.aniongap-modal').css("left", ( $(window).width() - width ) * 0.5  );
};
//Calculate modal width
function setAnionGapModalWidth (window) {
	if ( window < 620  ) {
		width = window * 0.85;
	} else {
		width = 600;
	}
	return width;
};

$(document).ready(function(){
	//we change size of anion gap modal if viewport size changes
	$(window).resize(function() {
		setAnionGapModalPosition();
	});

	$('input[type=number]').val("");
    $('#pH').focus();
    //setting analyte units
    $('.SI').hide();
    loadPreference();
    var units = "mmHg";
    $('.SI-toggle').click(function(){
        unitToggle(".SI-toggle",".US-toggle",'.SI','.US',0.133322368,0.01,"kPa");
    });
    $('.US-toggle').click(function(){
        unitToggle(".US-toggle",".SI-toggle",'.US','.SI',1,0.1,"mmHg");
    });

    $('form[name=abgcalc]').submit(function(event){
        event.preventDefault();
        $('#units').hide();

        //setting analyte values
        var pH = getStandardisedValues("pH",false);
        var PaO2 = getStandardisedValues("PaO2",true);
        var PaCO2 = getStandardisedValues("PaCO2",true);
        var HCO3 = getStandardisedValues("HCO3",false);

        //calculating analyte percentage changes
        var PaCO2Change = Math.abs(PaCO2 - 40);
        var HCO3Change = Math.abs(24 - HCO3);
        var PaCO2PercentageChange = PaCO2Change / 40;
        var HCO3PercentageChange = HCO3Change / 24;

        //tabulating user's inputs
        $('.submitted-values').append("<div class='container values-row'>\
                                            <div class='row'>\
                                                <div class='col-xs-6 col-sm-3'>\
                                                    pH <span class='badge'> " + pH + " </span>\
                                                </div>\
                                                <div class='col-xs-6 col-sm-3'>\
                                                    P<sub>a</sub>O<sub>2</sub> <span class='badge'>" + (PaO2 * conversionFactor).toFixed(1)  + units + "</span>\
                                                </div>\
                                                <div class='col-xs-6 col-sm-3'>\
                                                    P<sub>a</sub>CO<sub>2</sub> <span class='badge'>" + (PaCO2 * conversionFactor).toFixed(1) + units + "</span>\
                                                </div>\
                                                <div class='col-xs-6 col-sm-3'>\
                                                    HCO<sub>3</sub><sup>-</sup> <span class='badge'>" + HCO3 + "mmEq/L</span>\
                                                </div>\
                                            </div>\
                                        </div>");
        
        //checking validity of sample
        var calculatedH = (24 * PaCO2) / HCO3;
        alert("calculated H: " + calculatedH + " " + typeof calculatedH);
        var calculatedpH = parseFloat(((-Math.log10(calculatedH / 1000000000)).toFixed(2)));
        alert("calculatedpH: " + calculatedpH + typeof calculatedpH);
        alert("Is pH same as calculatedpH?: " + (pH === calculatedpH));
        if (pH !== calculatedpH) {
            $('.validity').addClass('alert alert-danger');
            $('.validity').html("<strong>Caution: </strong>Calculated pH is " + calculatedpH + " using a modified Henderson-Hasselbach equation. If this differs significantly from the ABG pH then your ABG might be invalid.");
        }

        //acidaemia pathway
        if (pH < 7.35) {
                if (PaCO2 > 45 && (HCO3 >= 22 || PaCO2PercentageChange > HCO3PercentageChange)) {
                    primary = respiratoryAcidosis;
                    onset = respiratoryOnset(calculatedH,PaCO2PercentageChange);
                    secondary = respiratoryAcidosisCompensation(onset,PaCO2Change,HCO3);
                } else if (HCO3 < 22 && (PaCO2 <= 45 || PaCO2PercentageChange < HCO3PercentageChange)) {
                    primary = metabolicAcidosis;
                    secondary = metabolicAcidosisCompensation(HCO3,PaCO2);
                } else if (PaCO2 <= 45 && HCO3 >= 22) {
                    primary = error();
                } else {
                    primary = "Equal respiratory and metabolic acidosis";
                    secondary = noDisorder;
                }
            alert("Primary:" + primary + " " + typeof primary);
            alert("Secondary: " + secondary + " " + typeof secondary);
        //alkalaemia pathway
        } else if (pH > 7.45) {
                if (PaCO2 < 35 && (HCO3 <= 26 || PaCO2PercentageChange > HCO3PercentageChange)) {
                    var primary = respiratoryAlkalosis;
                    onset = respiratoryOnset(calculatedH,PaCO2PercentageChange);
                    secondary = respiratoryAlkalosisCompensation(onset,PaCO2Change,HCO3);
                } else if (HCO3 > 26 && (PaCO2 >= 35 || PaCO2PercentageChange < HCO3PercentageChange)) {
                    var primary = metabolicAlkalosis;
                    secondary = metabolicAlkalosisCompensation(HCO3Change,PaCO2);
                } else if (PaCO2 >= 35 && HCO3 <= 26) {
                    primary = error();
                } else {
                    var primary = "Equal respiratory and metabolic alkalosis";
                }
            alert("Primary: " + primary + typeof primary);
            alert("Secondary: " + secondary + " " + typeof secondary);
        //normal pH pathway
        } else {
            if (PaCO2 > 45 || HCO3 > 26) {
                if (PaCO2PercentageChange > HCO3PercentageChange){
                    primary = respiratoryAcidosis;
                    secondary = "Metabolic alkalosis (fully compensating)";
                } else if (PaCO2PercentageChange < HCO3PercentageChange) {
                    primary = metabolicAlkalosis;
                    secondary = "Respiratory acidosis (fully compensating)";
                } else {
                    primary = "Equal respiratory acidosis and metabolic alkalosis";
                    secondary = noDisorder;
                }
            } else if (PaCO2 < 35 || HCO3 < 22) {
                if (PaCO2PercentageChange > HCO3PercentageChange){
                    primary = respiratoryAlkalosis;
                    secondary = "Metabolic acidosis (fully compensating)";
                } else  if (PaCO2PercentageChange < HCO3PercentageChange) {
                    primary = metabolicAcidosis;
                    secondary = "Respiratory alkalosis (fully compensating)";
                } else {
                    primary = "Equal respiratory alkalosis and metabolic acidosis";
                    secondary = noDisorder;
                }
            } else {
                primary = "There is no acid-base disturbance";
                secondary = noDisorder;
            }
            alert("Primary: " + primary + " " + typeof primary);
            alert("Secondary: " + secondary + " " + typeof secondary);
            alert(primary !== "There is no acid-base disturbance");
        }
        //We display acid-base result to page
        if (secondary != noDisorder && error_present == false) {
        	$(".acidbase").append("<p><strong>Primary:</strong> " + primary + "</p>");
        	$(".acidbase").append("<p><strong>Secondary:</strong> " + secondary + "</p>");
        } else {
        	$(".acidbase").append("<p>" + primary + "</p>");
        }
        if (onset != "" && error_present == false && (primary == respiratoryAlkalosis || primary == respiratoryAcidosis)) {
            $(".acidbase").append("<p><strong>Respiratory Onset:</strong> " + onset + "</p>")
        }
        if (primary != "There is no acid-base disturbance" && error_present == false) {
            $(".acidbase").append("<div class='row' id='suggestions'><div class='col-xs-6'><a class='aetiologies suggested' href='#suggestions'>Get Suggested Aetiologies</a></div><div class='col-xs-6'><button id='reanalyse'>Analyse another ABG</button></div></div>");
            $('#results > #reanalyse').hide();
        }
        //shows anion gap modal
        $('.checkanion').click(function(){
            setAnionGapModalPosition();
            $('.aniongap-modal').slideDown();
        });
        //closes anion gap modal
        $('#closeanion').click(function(event){
        	event.preventDefault();
        	$('.aniongap-modal').slideUp();
        	$('#submitanion input[type=number]').val("");
        });
        //anion gap calculations
        $('#submitanion').submit(function(){
            var sodium = parseInt($('#sodium').val());
            var chloride = parseInt($('#chloride').val());
            alert("Sodium: " + sodium + " " + typeof sodium);
            alert("Chloride: " + chloride + " " + typeof chloride);
            var aniongapValue = sodium - chloride - HCO3;
            alert("Anion gap: " + aniongapValue + typeof aniongapValue);
            $('tr').append("<td>Na<sup>+</sup> <span class='badge'>" + sodium + "mmol/L </span></td><td>Cl<sup>-</sup> <span class='badge'>" + chloride + "mmol/L</span></td>");
            $('#submitanion input[type=number]').val(0);
            $('#submitanion, .checkanion').hide();
            if (aniongapValue > 12) {
                aniongapRatio = (aniongapValue - 12) / (24 - HCO3);
                if (aniongapRatio > 2) {
                    var aniongap = "High anion gap (" + aniongapValue + ") - a concurrent metabolic alkalosis is likely to be present";
                } else if (aniongapRatio < 1) {
                    var aniongap = "High anion gap (" + aniongapValue + ") - a concurrent normal anion-gap metabolic acidosis is likely to be present";
                } else {
                    var aniongap = "High anion gap (" + aniongapValue + ") - pure anion gap acidosis";
                }
            } else {
                var aniongap = "Normal anion gap (" + aniongapValue + ")";
            }
            $(".acidbase").find('p').last().after("<p><strong>Anion Gap:</strong> " + aniongap + "</p>");
            if (aniongapValue <= 12) {
                $(".acidbase").find('p').last().after("<p><span class='glyphicon glyphicon-minus-sign'></span> In patients with hypoalbuminemia the normal anion gap is lower than 12mmol/L - in these patients the anion gap is about 2.5 mEq/L lower for each 1 gm/dL decrease in the plasma albumin concentration </p>");
            }
            if (aniongapValue > 12) {
                $(".acidbase").find('p').last().after("<p><span class='glyphicon glyphicon-minus-sign'></span>  Consider calculating the osmolal gap if the anion gap cannot be explained by an obvious cause or toxic ingestion is suspected. The osmolal gap formula is:  Plasma Osmolality - 2*(Na<sup>+</sup> mmol/L) + (glucose mmol/L)/18 + (urea mmol/L)/2.8 + 1.25*(ethanol mmol/L)</p>");
                $(".acidbase").find('p').last().after("<p><span class='glyphicon glyphicon-minus-sign'></span>  Please note that the disorder suggested after the anion gap value is based on variability from normal anion gap- thus this will no be accurate for patients with hypoalbuminemia as their normal anion gap is lower than 12mmol/L - in these patients the anion gap is about 2.5 mEq/L lower for each 1 gm/dL decrease in the plasma albumin concentration </p>");
            }
        });
        //toggle panels suggested aetiologies panels into view
        $('.aetiologies').click(function(){
            if ($('.aetiologies').hasClass('suggested')) {
                $('.suggested').addClass('closeSuggested').removeClass('suggested').text("Close Suggested Aetiologies");
                if ((primary === respiratoryAcidosis && secondary  === metabolicAcidosis) || (primary === metabolicAcidosis && secondary  === respiratoryAcidosis) || (primary === "Equal respiratory and metabolic acidosis")) {
                    $('#results').append($('#respacidosis-metacidosis').html());
                }
                if ((primary === respiratoryAlkalosis && secondary  === metabolicAlkalosis) || (primary === metabolicAlkalosis && secondary  === respiratoryAlkalosis) || (primary === "Equal respiratory and metabolic alkalosis")) {
                    $('#results').append($('#respalkalosis-metalkalosis').html());
                }
                if ((primary === respiratoryAcidosis && secondary  === "Metabolic alkalosis (fully compensating)") || (primary === metabolicAlkalosis && secondary  === "Respiratory acidosis (fully compensating)") || (primary === "Equal respiratory acidosis and metabolic alkalosis")) {
                    $('#results').append($('#respacidosis-metalkalosis').html());
                }
                if ((primary === respiratoryAlkalosis && secondary  === "Metabolic acidosis (fully compensating)") || (primary === metabolicAcidosis && secondary  === "Respiratory alkalosis (fully compensating)") || (primary === "Equal respiratory alkalosis and metabolic acidosis")) {
                    $('#results').append($('#respalkalosis-metacidosis').html());
                }
                if (primary === respiratoryAcidosis) {
                    $('#results').append($('#respiratory-acidosis').html());
                }
                if (primary === respiratoryAlkalosis) {
                    $('#results').append($('#respiratory-alkalosis').html());
                }
                if (primary === metabolicAcidosis) {
                    $('#results').append($('#metabolic-acidosis').html());
                }
                if (primary === metabolicAlkalosis) {
                    $('#results').append($('#metabolic-alkalosis').html());
                }
                if (secondary === respiratoryAcidosis) {
                    $('#results').append($('#respiratory-acidosis').html());
                }
                if (secondary === respiratoryAlkalosis) {
                    $('#results').append($('#respiratory-alkalosis').html());
                }
                if (secondary === metabolicAcidosis) {
                    $('#results').append($('#metabolic-acidosis').html());
                }
                if (secondary === metabolicAlkalosis) {
                    $('#results').append($('#metabolic-alkalosis').html());
                }
                if (aniongapRatio > 2) {
                    $('#results').append($('#metabolic-alkalosis').html());
                }
            } else {
                $('.closeSuggested').addClass('suggested');
                $('.closeSuggested').text("Get Suggested Aetiologies");
                $('.closeSuggested').removeClass('closeSuggested');
                $('#results .panel').remove();
            }
        });
        $("form[name=abgcalc]").fadeOut("600");
        $("#results").delay("600").slideDown("600");
        $('#reanalyse').click(function(){
            $(".acidbase p, .acidbase button, #results .panel, .values-row").remove()
            $('#suggestions').remove();
            $(".validity").empty().removeClass('alert alert-danger');
            $("#results").css('display', 'none');
            $('input[type=number]').val("");
            $('#units, #results > #reanalyse').show();
            $("form[name=abgcalc]").show();
            $('#pH').focus();
            error_present = false;
        });
    });
});