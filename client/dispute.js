function searchDispute(id) {
    setLoader();

    var disputeId = id;

    fetch("/findDispute", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                disputeId
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Dispute not found or an error occurred: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            removeLoader();
            console.log(data);
            document.getElementById('disputeInfo').innerHTML = prettyPrintObject(data);
            document.getElementById('disputeInfo').classList.remove('hidden');
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        })
        .catch(error => {
            alert(`An error occurred: ${error.message}`);
        });
}


function searchCustomers(button) {

    setLoader();

    const searchType = button.getAttribute('data-search-type');

    let createdAtStartDate = document.getElementById('startDate').value ? document.getElementById('startDate').value : "";
    let createdAtEndDate = document.getElementById('endDate').value ? document.getElementById('endDate').value : "";

    let payload = {};

    // Utilisez la valeur de searchType pour déterminer le type de recherche à effectuer
    if (searchType === 'name') {
        payload = {
            firstName,
            lastName
        };
    } else if (searchType === 'email') {
        payload = {
            email
        };
    } else if (searchType === 'createdAt') {
        payload = {
            createdAtStartDate,
            createdAtEndDate
        }
    } else if (searchType === 'PMToken') {
        payload = {
            PMToken
        }
    }
    fetch('/searchDispute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            // Traitez les données de réponse et mettez à jour votre interface utilisateur.
            console.log(data);

            //SHOW TABLE AND REMOVE LOADING
            removeLoader();
            document.querySelector('.result').removeAttribute('hidden');

            //CLEAR TABLE
            document.querySelector('.tableContent').innerHTML = "";
            document.querySelector('#nbRowS').innerHTML = "";

            //NUMBER OF LINE IN TABLE
            document.querySelector('#nbRowS').innerHTML += data.length
            document.querySelector('#nbRowP').removeAttribute('hidden')
            document.querySelector('#nbRowS').removeAttribute('hidden')

            if (data.length == 0) {
                document.querySelector('.tableContent').innerHTML += "NO DATA";
            } else {
                for (var i = 0; i < data.length; i++) {
                    colorText = "black";
                    color = data[i].status === "lost" ? "red" : (data[i].status === "won" ? "green" : "aliceblue");

                    document.querySelector('.tableContent').innerHTML += `
                    <tr style="color: ${colorText}; background-color: ${color};" class="border-b dark:border-neutral-500">
                        <td class="whitespace-nowrap px-6 py-4">${data[i].id}</td>
                        <td>
                        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" target="_blank" onclick="searchDispute('${data[i].id}')">
                            GET DETAILS
                        </button>
                        </td>
                        <td class="whitespace-nowrap px-6 py-4">${data[i].receivedDate}</td>
                        <td class="whitespace-nowrap px-6 py-4">${data[i].status}</td>
                        <td class="whitespace-nowrap px-6 py-4">${data[i].reason}</td>
                        <td>
                        <a class="bg-blue-500 hover-bg-blue-700 text-white font-bold py-2 px-4 rounded" target="_blank" href="${data[i].link}">
                            Link to BO
                        </a>
                        </td>
                    </tr>
                    `;
                }
            }
        })
        .catch(error => {
            console.error('Une erreur s\'est produite : ', error);
        });
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
    
    document.getElementById('lastYearButton').addEventListener('click', function () {
        setDateRange(365, 0);
    });
});