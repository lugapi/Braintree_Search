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

                // Add the refund button with the checkbox and amount input
                var refundButtonHtml = "<td>";

                // Condition to show a message if the status is "settled"
                if (response[i].status !== "settled" || response[i].type === "credit") {
                    refundButtonHtml += "<button class='bg-gray-300 cursor-not-allowed text-gray-500 font-bold py-2 px-4 rounded' title='Transaction not settled yet'>Refund</button>";
                } else {
                    refundButtonHtml += "<input id='amountToRefund' class='m-2' type='number' step='0.01' placeholder='Enter amount' class='refund-amount-input' /> <button class='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded refund-btn' data-transaction-id='" + response[i].id + "' data-transaction-amount='" + response[i].amount + "'>Refund</button>";
                }

                refundButtonHtml += "</td>";

                document.querySelector('.tableContent').innerHTML += "<tr style='color: " + colorText + ";background-color: " + color + ";' class='border-b dark:border-neutral-500'><td class='whitespace-nowrap px-6 py-4'>" + response[i].id + "</td><td>" + response[i].orderid + "</td><td>" + response[i].date + "</td><td>" + response[i].type + "</td><td>" + response[i].status + "</td><td>" + response[i].amount + "</td><td>" + response[i].paymentInstrumentType + "</td><td><a class='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' target='_blank' href='" + response[i].link + "'>Link to BO</a></td>" + refundButtonHtml + "</tr>";


            }
        }
    }

    // Convert the JavaScript object to a JSON string
    http.send(JSON.stringify(data));
}

document.addEventListener('DOMContentLoaded', function () {
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

// REFUND TRANSACTION
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('refund-btn')) {
        var transactionId = event.target.getAttribute('data-transaction-id');
        var transactionAmount = event.target.getAttribute('data-transaction-amount');
        var refundAmountInput = event.target.parentNode.querySelector('.refund-amount-input');
        var amountToRefund = event.target.parentNode.querySelector('#amountToRefund').value;

        // Call the NodeJS API to partial refund
        fetch('/refundTransaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transactionAmount: transactionAmount,
                    transactionId: transactionId,
                    amount: amountToRefund,
                }),
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                alert(data.message);
            })
            .catch(error => {
                console.error('Error:', error);
                alert(data.message);
            });
    }
});