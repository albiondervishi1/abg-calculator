//Toggle between US and SI units
function unitToggle (thisUnitToggle, otherUnitToggle,thisUnitClass,otherUnitClass,conversionRate,stepDecimal,unitSuffix) {
    $(thisUnitToggle).addClass('active');
    $(thisUnitToggle).css("background-color","#247D70");
    $(thisUnitClass).show();
    $(otherUnitClass).hide();
    $(otherUnitToggle).removeClass('active');
    $(otherUnitToggle).css("background-color", "#34B3A0");
    $('form[name=abgcalc]').data("conversion", conversionRate);
    $('#PaCO2, #PaO2').attr("step", stepDecimal);
    units = unitSuffix;
}
//Respiratory disorder onset
function respiratoryOnset(calculatedH,PaCO2Change) {
    var onsetRatio = (Math.abs((40 - calculatedH)/40))/(PaCO2Change);
    if (onsetRatio < 0.3) {
        return "Chronic";
    } else if (onsetRatio > 0.8) {
        return "Acute";
    } else {
        return "Acute on chronic";
    }
};

//Respiratory acidosis compensation calculation
function respiratoryAcidosisCompensation(onset) {
    if (onset === "Chronic") {
        var expectedHCO3 = Math.round(3.5 * PaCO2Change / 10 + 24);
        if (HCO3 > expectedHCO3) {
            return metabolicAlkalosis;
        } else if (HCO3 < expectedHCO3) {
            return metabolicAcidosis;
        } else {
            return "None";
        }
    } else {
        var expectedHCO3 = Math.round(PaCO2Change / 10 + 24);
        if (HCO3 > expectedHCO3 + 3) {
            return metabolicAlkalosis;
        } else if (HCO3 < expectedHCO3 - 3) {
            return metabolicAcidosis;
        } else {
            return "None";
        }
    }
};

//Respiratory alkalosis compensation calculation
function respiratoryAlkalosisCompensation(onset) {
    if (onset === "Chronic") {
        var expectedHCO3 =  Math.round(PaCO2Change / 10);
        if (HCO3 > expectedHCO3 * 5) {
            return metabolicAlkalosis;
        } else if (HCO3 < expectedHCO3 * 7) {
            return metabolicAcidosis;
        } else {
            return "None";
        }
    } else {
        var expectedHCO3 = 24 - 2 * PaCO2Change / 10;
        if (HCO3 > expectedHCO3) {
            return metabolicAlkalosis;
        } else if (HCO3 < expectedHCO3) {
            return metabolicAcidosis;
        } else {
            return "None";
        }
    }
};

$(document).ready(function(){
    $('input[type=number]').val("");
    $('#pH').focus();

    $('.SI').hide();
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
        var pH = parseFloat($('input[name=pH]').val());
        var PaO2 = parseFloat((($('input[name=PaO2]').val()) / $('form[name=abgcalc]').data("conversion")).toFixed(1));
        var PaCO2 = parseFloat((($('input[name=PaCO2]').val()) / $('form[name=abgcalc]').data("conversion")).toFixed(1));
        var HCO3 = parseFloat($('input[name=HCO3]').val());
        alert("pH: " + pH + " " + typeof pH);
        alert("PaO2: " + PaO2 + " " + typeof PaO2);
        alert("PaCO2: " + PaCO2 + " " + typeof PaCO2);
        alert("HCO3: " + HCO3 + " " + typeof HCO3);
        //tabulating user's inputs
        $('.submitted-values').append("<div class='table-responsive'><table class='table'><tr><td>pH <span class='badge'>" + pH + "</span></td><td>P<sub>a</sub>O<sub>2</sub> <span class='badge'>" + Math.round(PaO2 * $('form[name=abgcalc]').data("conversion"))  + units + "</span></td><td>P<sub>a</sub>CO<sub>2</sub> <span class='badge'>" + Math.round(PaCO2 * $('form[name=abgcalc]').data("conversion")) + units + "</span></td><td>HCO<sub>3</sub><sup>-</sup> <span class='badge'>" + HCO3 + "mmEq/L</span></td></tr></table></div>")
        //checking validity of sample
        var calculatedH = (24 * PaCO2)/HCO3;
        alert("calculated H: " + calculatedH + " " + typeof calculatedH);
        var calculatedpH = parseFloat(((-Math.log10(calculatedH / 1000000000)).toFixed(2)));
        alert("calculatedpH: " + calculatedpH + typeof calculatedpH);
        alert("Is pH same as calculatedpH?: " + (pH === calculatedpH));
        if (pH !== calculatedpH) {
            $('.validity').addClass('alert alert-danger');
            $('.validity').html("<strong>Caution: </strong>Calculated pH is " + calculatedpH + " using a modified Henderson-Hasselbach equation. If this differs significantly from the ABG pH then your ABG might be invalid.");
        }
        //declaring variables for global scope
        var secondary = 0;
        var primary = 0;
        var onset = 0;
        function error () {
                primary = "Unable to ascertain a primary disorder.";
                secondary = "Unable to ascertain if secondary disorder present.";
        };
        //declaring disorders
        var respiratoryAcidosis = "Respiratory acidosis";
        var respiratoryAlkalosis = "Respiratory alkalosis";
        var metabolicAcidosis = "Metabolic acidosis <button type='button' class='checkanion'>Check Anion Gap</button>";
        var metabolicAlkalosis = "Metabolic alkalosis";

        //calculating analyte percentage changes
        var PaCO2Change = Math.abs((PaCO2 - 40 )) / 40;
        var HCO3Change = Math.abs((24 - HCO3)) / 24;

        //acidaemia pathway
        if (pH < 7.35) {
            //checking for respiratory acidosis onset
            onset = respiratoryOnset(calculatedH,PaCO2Change);
            //checking respiratory acidosis compensation
            secondary = respiratoryAcidosisCompensation(onset);
            alert("Secondary: " + secondary + " " + typeof secondary);
            //metabolic acidosis compensation calculation
            function metabolicAcidosisCompensation () {
                var expectedPaCO2 = Math.round((1.5 * HCO3) + 8);
                if (PaCO2 > (expectedPaCO2 + 2)) {
                    secondary = respiratoryAcidosis;
                } else if (PaCO2 < (expectedPaCO2 - 2)) {
                    secondary = respiratoryAlkalosis;
                } else {
                    secondary = "None";
                }
                alert("Secondary: " + secondary + " " + typeof secondary);
            };
            //acidaemia disorder pathway
            if (PaCO2 > 45 && HCO3 < 22) {
                if (PaCO2Change > HCO3Change){
                    primary = respiratoryAcidosis;
                    onset = respiratoryOnset(calculatedH,PaCO2Change);
                    secondary = respiratoryAcidosisCompensation(onset);
                    alert("Secondary: " + secondary + " " + typeof secondary);
                } else if (PaCO2Change < HCO3Change){
                    primary = metabolicAcidosis;
                    metabolicAcidosisCompensation();
                } else {
                    primary = "Equal respiratory and metabolic acidosis";
                    secondary = "None";
                }
            } else if (PaCO2 > 45 && HCO3 >= 22) {
                primary = respiratoryAcidosis;
                onset = respiratoryOnset(calculatedH,PaCO2Change);
                secondary = respiratoryAcidosisCompensation(onset);
                alert("Secondary: " + secondary + " " + typeof secondary);
            } else if (PaCO2 <= 45 && HCO3 < 22) {
                primary = metabolicAcidosis;
                metabolicAcidosisCompensation();
            } else {
                error();
            }
            alert("Primary:" + primary + " " + typeof primary);
            alert("Secondary: " + secondary + " " + typeof secondary);
        //alkalaemia pathway
        } else if (pH > 7.45) {
            //checking for respiratory alkalosis onset
            onset = respiratoryOnset(calculatedH,PaCO2Change);
            //respiratory alkalosis compensation calculation
            secondary = respiratoryAlkalosisCompensation(onset) {
            alert("Secondary: " + secondary + " " + typeof secondary);
            //metabolic alkalosis compensation calculation
            function metabolicAlkalosisCompensation () {
                var expectedPaCO2 = Math.round(40 + 0.6 * HCO3Change);
                if (PaCO2 > expectedPaCO2) {
                    secondary = respiratoryAcidosis;
                } else if (PaCO2 < expectedPaCO2) {
                    secondary = respiratoryAlkalosis;
                } else {
                    secondary = "None";
                }
                alert("Secondary: " + secondary + " " + typeof secondary);
            };
            //alkalaemia disorder pathway
            if (PaCO2 < 35 && HCO3 > 26) {
                if (PaCO2Change > HCO3Change){
                    var primary = respiratoryAlkalosis;
                    onset = respiratoryOnset(calculatedH,PaCO2Change);
                    secondary = respiratoryAlkalosisCompensation(onset);
                } else if (PaCO2Change < HCO3Change) {
                    var primary = metabolicAlkalosis;
                    metabolicAlkalosisCompensation();
                } else {
                    var primary = "Equal respiratory and metabolic alkalosis";
                }
            } else if (PaCO2 < 35 && HCO3 <= 26) {
                var primary = respiratoryAlkalosis;
                onset = respiratoryOnset(calculatedH,PaCO2Change);
                secondary = respiratoryAlkalosisCompensation(onset);
            } else if (PaCO2 >= 35 && HCO3 > 26) {
                var primary = metabolicAlkalosis;
                metabolicAlkalosisCompensation();
            } else {
                error();
            }
            alert("Primary: " + primary + typeof primary);
            alert("Secondary: " + secondary + " " + typeof secondary);
        //normal pH pathway
        } else {
            if (PaCO2 > 45 || HCO3 > 26) {
                if (PaCO2Change > HCO3Change){
                    primary = respiratoryAcidosis;
                    secondary = "Metabolic alkalosis (fully compensating)";
                } else if (PaCO2Change < HCO3Change) {
                    primary = metabolicAlkalosis;
                    secondary = "Respiratory acidosis (fully compensating)";
                } else {
                    primary = "Equal respiratory acidosis and metabolic alkalosis";
                    secondary = "None";
                }
            } else if (PaCO2 < 35 || HCO3 < 22) {
                if (PaCO2Change > HCO3Change){
                    primary = respiratoryAlkalosis;
                    secondary = "Metabolic acidosis (fully compensating)";
                } else  if (PaCO2Change < HCO3Change) {
                    primary = metabolicAcidosis;
                    secondary = "Respiratory alkalosis (fully compensating)";
                } else {
                    primary = "Equal respiratory alkalosis and metabolic acidosis";
                    secondary = "None";
                }
            } else {
                primary = "There is no acid-base disturbance";
                secondary = "None";
            }
            alert("Primary: " + primary + " " + typeof primary);
            alert("Secondary: " + secondary + " " + typeof secondary);
            alert(primary !== "There is no acid-base disturbance");
        }
        //We log acid-base result to console
        $(".acidbase").append("<p><strong>Primary:</strong> " + primary + "</p>");
        $(".acidbase").append("<p><strong>Secondary:</strong> " + secondary + "</p>");
        if (onset != 0) {
            $(".acidbase").append("<p><strong>Onset:</strong> " + onset + "</p>")
        }
        if (primary != "There is no acid-base disturbance" && primary != "Unable to ascertain a primary disorder.") {
            $(".acidbase").append("<div class='row' id='suggestions'><div class='col-xs-6'><a class='aetiologies suggested' href='#suggestions'>Get Suggested Aetiologies</a></div><div class='col-xs-6'><button id='reanalyse'>Analyse another ABG</button></div></div>");
            $('#results > #reanalyse').hide();
        }
        //expands anion gap form
        $('.checkanion').click(function(){
            if ($('.checkanion').hasClass('toggled')) {
                $('#submitanion').hide();
                $('.checkanion').removeClass('toggled').text("Check Anion Gap");
                $('#submitanion input[type=number]').val(0);
            } else {
                $('.checkanion').closest('.acidbase').find('p').first().after($('#submitanion').show());
                $('.checkanion').addClass('toggled').text("Close Anion Gap Calculator");
            }
        });
        //anion gap calculator
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
            $(".acidbase p, .acidbase button, #results .panel, table").remove()
            $('#suggestions').remove();
            $(".validity").empty().removeClass('alert alert-danger');
            $("#results").css('display', 'none');
            $('input[type=number]').val("");
            $('#units, #results > #reanalyse').show();
            $("form[name=abgcalc]").show();
            $('#pH').focus();
        });
    });
});