function setLoader() {
    document.querySelector('.container').style.opacity = '0.2';
    document.querySelector('#loading').removeAttribute('hidden');
}

function removeLoader() {
    document.querySelector('.container').style.opacity = '1';
    document.querySelector('#loading').setAttribute('hidden', 'hidden');
}

const today = new Date();
const endDateInput = document.getElementById('endDate');
endDateInput.value = today.toISOString().slice(0, 10) + "T23:59";

function searchResult(searchfield) {

    setLoader();
    document.querySelector('.result').setAttribute('hidden', 'hidden');

    var amountMax = document.querySelector('#inputMaxValue').value
    var amountMin = document.querySelector('#inputMinValue').value

    var statusIs = document.querySelector('#statusIs').value
    var statusSA = document.querySelector('#statusIsSA').value

    var amountMaxSA = document.querySelector('#inputMaxValueSA').value
    var amountMinSA = document.querySelector('#inputMinValueSA').value

    var startDate = document.querySelector('#startDate').value
    var endDate = document.querySelector('#endDate').value

    var http = new XMLHttpRequest();
    var url = 'searchTransaction';

    if (searchfield == "minmax") {
        var data = {
            amountMax: amountMax,
            amountMin: amountMin
        };
    } else if (searchfield == "statusIs") {
        console.log('statusis')
        var data = {
            statusIs: statusIs
        };
    } else if (searchfield == "statusAndAmount") {
        console.log('statusAndAmount')
        var data = {
            amountMaxSA: amountMaxSA,
            amountMinSA: amountMinSA,
            statusSA: statusSA
        };
    } else if (searchfield == "FromToDate") {
        console.log('FromToDate')
        var data = {
            from: startDate,
            to: endDate
        };
    }

    http.open('POST', url, true);

    // Send the proper header information along with the request
    http.setRequestHeader('Content-type', 'application/json');

    http.onreadystatechange = function () {
        if (http.readyState == 4 && http.status == 200) {

            //SHOW TABLE AND REMOVE LOADING
            removeLoader();
            document.querySelector('.result').removeAttribute('hidden');

            response = JSON.parse(http.responseText);
            console.log(response);
            // console.log(http.responseText);
            // document.querySelector('.result').innerHTML += JSON.decode(http.responseText, null, 4);

            //CLEAR TABLE
            document.querySelector('.tableContent').innerHTML = "";
            document.querySelector('#nbRowS').innerHTML = "";

            //NUMBER OF LINE IN TABLE
            document.querySelector('#nbRowS').innerHTML += response.length
            document.querySelector('#nbRowP').removeAttribute('hidden')
            document.querySelector('#nbRowS').removeAttribute('hidden')

            for (var i = 0; i < response.length; i++) {
                if (response[i].paymentInstrumentType == "paypal_account") {
                    var color = "aliceblue";
                }
                if (response[i].paymentInstrumentType == "credit_card") {
                    var color = "#ffe4c454";
                }
                if (response[i].status == "gateway_rejected") {
                    var colorText = "red";
                } else {
                    var colorText = "black";
                }
                //console.log(response[i].id)
                document.querySelector('.tableContent').innerHTML += "<tr style='color: " + colorText + ";background-color: " + color + ";' class='border-b dark:border-neutral-500'><td class='whitespace-nowrap px-6 py-4'>" + response[i].id + "</td><td>" + response[i].orderid + "</td><td>" + response[i].date.date + "</td><td>" + response[i].status + "</td><td>" + response[i].amount + "</td><td>" + response[i].paymentInstrumentType + "</td><td><a class='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' target='_blank' href='" + response[i].link + "'>Link to BO</a></td></tr>"
            }
        }
    }

    // Convert the JavaScript object to a JSON string
    http.send(JSON.stringify(data));
}

document.addEventListener('DOMContentLoaded', function () {
    // Function to set date range
    function setDateRange(startOffset, endOffset) {
        var endDate = new Date();
        var startDate = new Date();

        startDate.setUTCDate(startDate.getUTCDate() - startOffset);
        startDate.setUTCHours(0, 0, 0, 0);

        endDate.setUTCDate(endDate.getUTCDate() - endOffset);
        endDate.setUTCHours(0, 0, 0, 0);

        document.getElementById('startDate').value = startDate.toISOString().slice(0, -8);
        document.getElementById('endDate').value = endDate.toISOString().slice(0, -8);
    }

    // Add event listeners for the preset buttons using the setDateRange function
    document.getElementById('todayButton').addEventListener('click', function () {
        setDateRange(0, 0);
    });

    document.getElementById('yesterdayButton').addEventListener('click', function () {
        setDateRange(1, 0);
    });

    document.getElementById('last7DaysButton').addEventListener('click', function () {
        setDateRange(7, 0);
    });

    document.getElementById('lastMonthButton').addEventListener('click', function () {
        setDateRange(0, 30);
    });

});