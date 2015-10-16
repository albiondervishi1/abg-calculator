$(document).ready(function(){
    $('.SI').hide();
    $('input[type=number]').val(0);
    var units = "mmHg";
    $('.SI-toggle').click(function(){
        $('.US-toggle').removeClass('active');
        $('.SI-toggle').css("background-color","#247D70");
        $('.US-toggle').css("background-color", "#34B3A0");
        $(this).addClass('active');
        $('.US').hide();
        $('.SI').show();
        $('form').data("conversion", 0.133322368);
        $('#PaCO2, #PaO2').attr("step", 0.1);
        alert($('form').data("conversion"));
        units = "kPa";
    });
    $('.US-toggle').click(function(){
        $('.SI-toggle').removeClass('active');
        $(this).addClass('active');
        $('.US-toggle').css("background-color","#247D70");
        $('.SI-toggle').css("background-color", "#34B3A0");
        $('.SI').hide();
        $('.US').show();
        $('form').data("conversion", 1);
        $('#PaCO2, #PaO2').attr("step", 1);
        alert($('form').data("conversion"));
        units = "mmHg";
    });
    $('form').submit(function(event){
        event.preventDefault();
        $('#units').hide();
        alert("Conversion rate: " + $('form').data("conversion"));
        var pH = parseFloat($('input[name=pH]').val());
        var PaO2 = Math.round(($('input[name=PaO2]').val()) / $('form').data("conversion"));
        var PaCO2 = Math.round(($('input[name=PaCO2]').val()) / $('form').data("conversion"));
        var HCO3 = parseFloat($('input[name=HCO3]').val());
        alert("pH: " + pH + " " + typeof pH);
        alert("PaO2: " + PaO2 + " " + typeof PaO2);
        alert("PaCO2: " + PaCO2 + " " + typeof PaCO2);
        alert("HCO3: " + HCO3 + " " + typeof HCO3);
        //tabulating user's inputs
        $('.submitted-values').append("<table class='table'><tr><td>pH <span class='badge'>" + pH + "</span></td><td>P<sub>a</sub>O<sub>2</sub> <span class='badge'>" + Math.round(PaO2 * $('form').data("conversion"))  + units + "</span></td><td>P<sub>a</sub>CO<sub>2</sub> <span class='badge'>" + Math.round(PaCO2 * $('form').data("conversion")) + units + "</span></td><td>HCO<sub>3</sub><sup>-</sup> <span class='badge'>" + HCO3 + "mmEq/L</span></td></tr></table>")
        //checking validity of sample
        var calculatedH = (24 * PaCO2)/HCO3;
        alert("calculated H: " + calculatedH + " " + typeof calculatedH);
        var calculatedpH = parseFloat(((-Math.log10(calculatedH / 1000000000)).toFixed(2)));
        alert("calculatedpH: " + calculatedpH + typeof calculatedpH);
        alert ("Is pH same as calculatedpH?: " + (pH === calculatedpH));
        if (pH !== calculatedpH) {
            $('.validity').addClass('alert alert-danger');
            $('.validity').html("<strong>Caution: </strong>Your pH and a calculated H<sup>+</sup> using a modified Henderson-Hasselbach equation do not match. Your ABG might be invalid.");
        }
        //declaring variables for global scope
        var secondary = 0;
        var onset = 0;
        var primary = 0;
        function error () {
                primary = "Unable to ascertain a primary disorder.";
                secondary = "Unable to ascertain if secondary disorder present.";
        };
        //declaring disorders
        var respiratoryAcidosis = "Respiratory acidosis";
        var respiratoryAlkalosis = "Respiratory alkalosis";
        var metabolicAcidosis = "Metabolic acidosis";
        var metabolicAlkalosis = "Metabolic alkalosis";
        //acidaemia pathway
        if (pH < 7.35) {
            var PaCO2Change = (PaCO2 - 40 )/ 40;
            alert("PaCO2Change " + PaCO2Change + " " + typeof PaCO2Change);
            var HCO3Change = (24 - HCO3)/24;
            alert("HCO3Change " + HCO3Change + " " + typeof HCO3Change);
            //respiratory acidosis onset function
            function respiratoryAcidosisOnset () {
                var onsetRatio = ((calculatedH - 40)/40)/(PaCO2Change);
                alert("Onset Ratio: " + onsetRatio + " " + typeof onsetRatio);
                if (onsetRatio < 0.3) {
                    onset = "Chronic";
                } else if (onsetRatio > 0.8) {
                    onset = "Acute";
                } else {
                    onset = "Acute on chronic";
                }
                alert("Onset: " + onset);
            };
            //respiratory acidosis compensation calculation
            function respiratoryAcidosisCompensation(onset) {
                if (onset === "Chronic") {
                    var expectedHCO3 = Math.round(3.5 * PaCO2Change / 10 + 24);
                    alert("Expected chronic HCO3: " + expectedHCO3 + " " + typeof expectedHCO3);
                    if (HCO3 > expectedHCO3) {
                        secondary = metabolicAlkalosis;
                    } else if (HCO3 < expectedHCO3) {
                        secondary = metabolicAcidosis;
                    } else {
                        secondary = "None";
                    }
                } else {
                    var expectedHCO3 = Math.round(PaCO2Change / 10 + 24);
                    alert("Expected acute HCO3: " + expectedHCO3 + " " + typeof expectedHCO3);
                    if (HCO3 > expectedHCO3 + 3) {
                        secondary = metabolicAlkalosis;
                    } else if (HCO3 < expectedHCO3 - 3) {
                        secondary = metabolicAcidosis;
                    } else {
                        secondary = "None";
                    }
                }
                alert("Secondary: " + secondary + " " + typeof secondary);
            };
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
                    respiratoryAcidosisOnset();
                    respiratoryAcidosisCompensation(onset);
                } else if (PaCO2Change < HCO3Change){
                    primary = metabolicAcidosis;
                    metabolicAcidosisCompensation();
                } else {
                    primary = "Equal respiratory and metabolic acidosis";
                    secondary = "None";
                }
            } else if (PaCO2 > 45 && HCO3 >= 22) {
                primary = respiratoryAcidosis;
                respiratoryAcidosisOnset();
                respiratoryAcidosisCompensation(onset);
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
            var PaCO2Change = (40 - PaCO2 )/ 40;
            var HCO3Change = (HCO3 - 24)/24;
            //respiratory alkalosis onset function
            function respiratoryAlkalosisOnset () {
                var onsetRatio = ((40 - calculatedH)/40)/(PaCO2Change);
                alert("Onset Ratio: " + onsetRatio + typeof onsetRatio);
                if (onsetRatio < 0.3) {
                    onset = "Chronic";
                } else if (onsetRatio > 0.8) {
                    onset = "Acute";
                } else {
                    onset = "Acute on chronic";
                }
                alert("Onset: " + onset + " " + typeof onset);
            };
            //respiratory alkalosis compensation calculation
            function respiratoryAlkalosisCompensation(onset) {
                if (onset === "Chronic") {
                    var expectedHCO3High =  Math.round(5 * PaCO2Change / 10);
                    var expectedHCO3Low = Math.round(7 * PaCO2Change / 10);
                    alert("Expected chronic HCO3: " + expectedHCO3);
                    if (HCO3 > expectedHCO3High) {
                        secondary = metabolicAlkalosis;
                    } else if (HCO3 < expectedHCO3Low) {
                        secondary = metabolicAcidosis;
                    } else {
                        secondary = "None";
                    }
                } else {
                    var expectedHCO3 = 24 - 2 * PaCO2Change / 10;
                    alert("Expected acute HCO3: " + expectedHCO3);
                    if (HCO3 > expectedHCO3) {
                        secondary = metabolicAlkalosis;
                    } else if (HCO3 < expectedHCO3) {
                        secondary = metabolicAcidosis;
                    } else {
                        secondary = "None";
                    }
                }
                alert("Secondary: " + secondary + " " + typeof secondary);
            };
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
                    respiratoryAlkalosisOnset();
                    respiratoryAlkalosisCompensation(onset);
                } else if (PaCO2Change < HCO3Change) {
                    var primary = metabolicAlkalosis;
                    metabolicAlkalosisCompensation();
                } else {
                    var primary = "Equal respiratory and metabolic alkalosis";
                }
            } else if (PaCO2 < 35 && HCO3 <= 26) {
                var primary = respiratoryAlkalosis;
                respiratoryAlkalosisOnset();
                respiratoryAlkalosisCompensation(onset);
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
                var PaCO2Change = (PaCO2 - 40 )/ 40;
                var HCO3Change = (HCO3 - 24)/24;
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
                var PaCO2Change = (40 - PaCO2)/ 40;
                var HCO3Change = (24 - HCO3)/24;
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
        //We log result to console
        $(".acidbase").append("<p><strong>Primary:</strong> " + primary + "</p>");
        $(".acidbase").append("<p><strong>Secondary:</strong> " + secondary + "</p>");
        if (onset != 0) {
            $(".acidbase").append("<p><strong>Onset:</strong> " + onset + "</p>")
        }
        if (primary != "There is no acid-base disturbance" && primary != "Unable to ascertain a primary disorder.") {
            $(".acidbase").append("<div class='row' id='suggestions'><div class='col-xs-6'><a class='aetiologies suggested' href='#suggestions'>Get Suggested Aetiologies</a></div><div class='col-xs-6'><button id='reanalyse'>Analyse another ABG</button></div></div>");
            $('#results > #reanalyse').hide();
        }
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
            } else {
                $('.closeSuggested').addClass('suggested');
                $('.closeSuggested').text("Get Suggested Aetiologies");
                $('.closeSuggested').removeClass('closeSuggested');
                $('#results .panel').remove();
            }
        });
        $("form").fadeOut("600");
        $("#results").delay("600").slideDown("600");
        $('#reanalyse').click(function(){
            $(".acidbase p, .acidbase button, #results .panel, table").remove()
            $('#suggestions').remove();
            $(".validity").empty().removeClass('alert alert-danger');
            $("#results").css('display', 'none');
            $('input[type=number]').val(0);
            $('#units, #results > #reanalyse').show();
            $("form").show();
        });
    });
});