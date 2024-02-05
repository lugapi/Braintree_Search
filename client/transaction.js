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

async function getRefundedAmount(id) {
    try {
        const response = await fetch("/findTransaction", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transactionId: id
            }),
        });

        if (!response.ok) {
            throw new Error(`Error fetching refunded amount: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data.amount);
        return {
            amount: data.amount,
            status: data.status
        };
    } catch (error) {
        console.error('Error fetching refunded amount:', error);
        throw error; // Re-throw the error to propagate it to the caller
    }
}



function searchTransaction(id) {
    setLoader();

    var transactionId = id;

    fetch("/findTransaction", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transactionId
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Transaction not found or an error occurred: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            removeLoader();
            console.log(data);
            document.getElementById('transactionInfo').innerHTML = prettyPrintObject(data);
            document.getElementById('transactionInfo').classList.remove('hidden');
            var elementToScrollTo = document.getElementById('transactionInfo');

            if (elementToScrollTo) {
                window.scrollTo({
                    top: elementToScrollTo.offsetTop,
                    behavior: 'smooth',
                });
            }

        })
        .catch(error => {
            alert(`An error occurred: ${error.message}`);
        });
}

async function searchResult(searchfield) {

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

    var orderId = document.querySelector('#orderId').value

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
    } else if (searchfield == "orderID") {
        console.log('orderID')
        var data = {
            orderId: orderId,
        };
    }

    http.open('POST', url, true);

    // Send the proper header information along with the request
    http.setRequestHeader('Content-type', 'application/json');

    http.onreadystatechange = function () {
        if (http.readyState == 4 && http.status == 200) {

            //SHOW TABLE AND REMOVE LOADING
            // removeLoader();
            document.querySelector('.result').removeAttribute('hidden');

            response = JSON.parse(http.responseText);
            // console.log(response);
            // console.log(http.responseText);
            // document.querySelector('.result').innerHTML += JSON.decode(http.responseText, null, 4);

            //CLEAR TABLE
            document.querySelector('.tableContent').innerHTML = "";
            document.querySelector('#nbRowS').innerHTML = "";

            //NUMBER OF LINE IN TABLE
            document.querySelector('#nbRowS').innerHTML += response.length
            document.querySelector('#nbRowP').removeAttribute('hidden')
            document.querySelector('#nbRowS').removeAttribute('hidden')

            // Create an array of promises for getRefundedAmount calls
            var refundedAmountPromises = [];

            for (var i = 0; i < response.length; i++) {
                var refundedAmountPromise = Promise.resolve(); // Initial resolved promise

                if (response[i].refundsAssociated.length > 0) {
                    // Create a promise for each refundAssociated
                    refundedAmountPromise = Promise.all(
                        response[i].refundsAssociated.map(refundId => getRefundedAmount(refundId))
                    );
                }

                refundedAmountPromises.push(refundedAmountPromise);
            }
            // Wait for all promises to resolve
            Promise.all(refundedAmountPromises)
                .then(refundedAmountsArrays => {
                    console.log('refundedAmountsArrays:', refundedAmountsArrays);

                    for (var i = 0; i < response.length; i++) {
                        // Extract the refunded amounts and statuses for the current transaction
                        var refundedAmountsAndStatuses = refundedAmountsArrays[i];

                        console.log('refundedAmountsAndStatuses:', refundedAmountsAndStatuses);

                        // Add a check to ensure refundedAmountsAndStatuses is defined
                        if (refundedAmountsAndStatuses) {
                            // Extract the refunded amounts and statuses for the current transaction
                            var refundedAmounts = refundedAmountsAndStatuses.map(item => item.amount);
                            var refundedStatuses = refundedAmountsAndStatuses.map(item => item.status);
                        }

                        // if (response[i].paymentInstrumentType == "paypal_account") {
                        //     var color = "aliceblue";
                        // }
                        // if (response[i].paymentInstrumentType == "credit_card") {
                        //     var color = "#ffe4c454";
                        // }
                        if (response[i].type == "sale") {
                            var color = "aliceblue";
                        }
                        if (response[i].type == "credit") {
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
                            refundButtonHtml += "<input id='amountToRefund' class='m-2' type='number' step='0.01' placeholder='Enter amount' class='refund-amount-input' /> <button class='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded refund-btn' data-transaction-id='" + response[i].id + "' data-transaction-amount='" + response[i].amount + "' data-refund-status='" + refundedStatuses[i] + "'>Refund</button>";
                        }

                        refundButtonHtml += "</td>";

                        if (response[i].refundsAssociated.length > 0) {
                            // Create a div for each refundAssociated
                            var refundsDivs = response[i].refundsAssociated.map(function (refund, index) {
                                return "<div><span class='underline text-blue-500 cursor-pointer hover:text-blue-700' onclick=\"searchTransaction('" + refund + "')\">" + refund + "</span><span class='amount"+refundedStatuses[index]+" '> (" + refundedAmounts[index] + " - " + refundedStatuses[index] + ")</span></div>";
                            });

                            // Combine the divs into a single string
                            var refundsAssociated = "<td><div class='flex flex-col gap-2'>" + refundsDivs.join('') + "</div></td>";

                            console.log(refundsAssociated);
                        } else {
                            var refundsAssociated = "<td>/</td>";
                        }

                        document.querySelector('.tableContent').innerHTML += "<tr style='color: " + colorText + ";background-color: " + color + ";' class='border-b dark:border-neutral-500'><td class='whitespace-nowrap px-6 py-4'>" + response[i].id + "</td><td><button class='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' target='_blank' onclick=\"searchTransaction('" + response[i].id + "')\">GET DETAILS</button></td><td>" + response[i].orderid + "</td><td>" + response[i].date + "</td><td>" + response[i].type + "</td><td>" + response[i].status + "</td><td>" + response[i].amount + "</td><td>" + response[i].paymentInstrumentType + "</td><td style='min-width: 150px'><a class='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' target='_blank' href='" + response[i].link + "'>Link to BO</a></td>" + refundsAssociated + refundButtonHtml + "</tr>";
                    }

                    removeLoader();
                })
                .catch(error => {
                    console.error('Error fetching refunded amounts:', error);
                });
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
        setDateRange(30, 0);
    });
});

// REFUND TRANSACTION
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('refund-btn')) {
        var transactionId = event.target.getAttribute('data-transaction-id');
        var transactionAmount = event.target.getAttribute('data-transaction-amount');
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