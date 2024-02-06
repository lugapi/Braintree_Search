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
        // console.log(data.amount);
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

            document.querySelector('.result').removeAttribute('hidden');

            response = JSON.parse(http.responseText);

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

                    for (var i = 0; i < response.length; i++) {
                        // Extract the refunded amounts and statuses for the current transaction
                        var refundedAmountsAndStatuses = refundedAmountsArrays[i];

                        // Add a check to ensure refundedAmountsAndStatuses is defined
                        if (refundedAmountsAndStatuses) {
                            // Extract the refunded amounts and statuses for the current transaction
                            var refundedAmounts = refundedAmountsAndStatuses.map(item => item.amount);
                            var refundedStatuses = refundedAmountsAndStatuses.map(item => item.status);
                        }

                        if (response[i].paymentInstrumentType == "paypal_account") {
                            var pmLogo = '<div class="flex items-center justify-center"><svg alt="PayPal" title="PayPal" class="payment-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M186.3 258.2c0 12.2-9.7 21.5-22 21.5-9.2 0-16-5.2-16-15 0-12.2 9.5-22 21.7-22 9.3 0 16.3 5.7 16.3 15.5zM80.5 209.7h-4.7c-1.5 0-3 1-3.2 2.7l-4.3 26.7 8.2-.3c11 0 19.5-1.5 21.5-14.2 2.3-13.4-6.2-14.9-17.5-14.9zm284 0H360c-1.8 0-3 1-3.2 2.7l-4.2 26.7 8-.3c13 0 22-3 22-18-.1-10.6-9.6-11.1-18.1-11.1zM576 80v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h480c26.5 0 48 21.5 48 48zM128.3 215.4c0-21-16.2-28-34.7-28h-40c-2.5 0-5 2-5.2 4.7L32 294.2c-.3 2 1.2 4 3.2 4h19c2.7 0 5.2-2.9 5.5-5.7l4.5-26.6c1-7.2 13.2-4.7 18-4.7 28.6 0 46.1-17 46.1-45.8zm84.2 8.8h-19c-3.8 0-4 5.5-4.2 8.2-5.8-8.5-14.2-10-23.7-10-24.5 0-43.2 21.5-43.2 45.2 0 19.5 12.2 32.2 31.7 32.2 9 0 20.2-4.9 26.5-11.9-.5 1.5-1 4.7-1 6.2 0 2.3 1 4 3.2 4H200c2.7 0 5-2.9 5.5-5.7l10.2-64.3c.3-1.9-1.2-3.9-3.2-3.9zm40.5 97.9l63.7-92.6c.5-.5 .5-1 .5-1.7 0-1.7-1.5-3.5-3.2-3.5h-19.2c-1.7 0-3.5 1-4.5 2.5l-26.5 39-11-37.5c-.8-2.2-3-4-5.5-4h-18.7c-1.7 0-3.2 1.8-3.2 3.5 0 1.2 19.5 56.8 21.2 62.1-2.7 3.8-20.5 28.6-20.5 31.6 0 1.8 1.5 3.2 3.2 3.2h19.2c1.8-.1 3.5-1.1 4.5-2.6zm159.3-106.7c0-21-16.2-28-34.7-28h-39.7c-2.7 0-5.2 2-5.5 4.7l-16.2 102c-.2 2 1.3 4 3.2 4h20.5c2 0 3.5-1.5 4-3.2l4.5-29c1-7.2 13.2-4.7 18-4.7 28.4 0 45.9-17 45.9-45.8zm84.2 8.8h-19c-3.8 0-4 5.5-4.3 8.2-5.5-8.5-14-10-23.7-10-24.5 0-43.2 21.5-43.2 45.2 0 19.5 12.2 32.2 31.7 32.2 9.3 0 20.5-4.9 26.5-11.9-.3 1.5-1 4.7-1 6.2 0 2.3 1 4 3.2 4H484c2.7 0 5-2.9 5.5-5.7l10.2-64.3c.3-1.9-1.2-3.9-3.2-3.9zm47.5-33.3c0-2-1.5-3.5-3.2-3.5h-18.5c-1.5 0-3 1.2-3.2 2.7l-16.2 104-.3 .5c0 1.8 1.5 3.5 3.5 3.5h16.5c2.5 0 5-2.9 5.2-5.7L544 191.2v-.3zm-90 51.8c-12.2 0-21.7 9.7-21.7 22 0 9.7 7 15 16.2 15 12 0 21.7-9.2 21.7-21.5 .1-9.8-6.9-15.5-16.2-15.5z"/></svg></div>';
                        }
                        if (response[i].paymentInstrumentType == "credit_card") {
                            var pmLogo = '<div class="flex items-center justify-center"><svg alt="Credit Card" title="Credit Card" class="payment-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M64 32C28.7 32 0 60.7 0 96v32H576V96c0-35.3-28.7-64-64-64H64zM576 224H0V416c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V224zM112 352h64c8.8 0 16 7.2 16 16s-7.2 16-16 16H112c-8.8 0-16-7.2-16-16s7.2-16 16-16zm112 16c0-8.8 7.2-16 16-16H368c8.8 0 16 7.2 16 16s-7.2 16-16 16H240c-8.8 0-16-7.2-16-16z"/></svg></div>';
                        }
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
                            refundButtonHtml += "<input id='amountToRefund' class='m-2 p-2 w-1/2' type='number' step='0.01' placeholder='Enter amount' class='refund-amount-input' /> <button class='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded refund-btn' data-transaction-id='" + response[i].id + "' data-transaction-amount='" + response[i].amount + "'>Refund</button>";
                        }

                        refundButtonHtml += "</td>";

                        // ADD INITIAL TRANSACTION IF IT'S A REFUND
                        if (response[i].refundedTransactionId !== null) {
                            var relatedInitialTransaction = "<span class='underline text-blue-500 cursor-pointer hover:text-blue-700' onclick=\"searchTransaction('" + response[i].refundedTransactionId + "')\">" + response[i].refundedTransactionId + "</span>";
                        } else {
                            var relatedInitialTransaction = "/";
                        }


                        console.log(relatedInitialTransaction)

                        if (response[i].refundsAssociated.length > 0) {
                            // Create a div for each refundAssociated
                            var refundsDivs = response[i].refundsAssociated.map(function (refund, index) {
                                return "<div><span class='underline text-blue-500 cursor-pointer hover:text-blue-700' onclick=\"searchTransaction('" + refund + "')\">" + refund + "</span><span class='amount" + refundedStatuses[index] + " '> (" + refundedAmounts[index] + " - " + refundedStatuses[index] + ")</span></div>";
                            });

                            // Combine the divs into a single string
                            var refundsAssociated = "<td><div class='flex flex-col gap-2'>" + refundsDivs.join('') + "</div></td>";

                            // console.log(refundsAssociated);
                        } else {
                            var refundsAssociated = "<td>" + relatedInitialTransaction + "</td>";
                        }

                        document.querySelector('.tableContent').innerHTML += "<tr style='color: " + colorText + ";background-color: " + color + ";' class='border-b dark:border-neutral-500'><td class='whitespace-nowrap px-6 py-4'>" + response[i].id + "</td><td><button class='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' target='_blank' onclick=\"searchTransaction('" + response[i].id + "')\">GET DETAILS</button></td><td>" + response[i].orderid + "</td><td>" + response[i].date + "</td><td>" + response[i].type + "</td><td>" + response[i].status + "</td><td>" + response[i].amount + "</td><td class='" + response[i].paymentInstrumentType + " text-center'>" + pmLogo + "</td><td style='min-width: 150px'><a class='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' target='_blank' href='" + response[i].link + "'>Link to BO</a></td>" + refundsAssociated + refundButtonHtml + "</tr>";
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
                if (data.success) {
                    alert("transaction has been refunded");
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert(data.message);
            });
    }
});