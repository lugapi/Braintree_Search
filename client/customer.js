function setLoader() {
    document.querySelector('.container').style.opacity = '0.2';
    document.querySelector('#loading').removeAttribute('hidden');
}

function removeLoader() {
    document.querySelector('.container').style.opacity = '1';
    document.querySelector('#loading').setAttribute('hidden', 'hidden');
}

function searchCustomer(id) {
    setLoader();

    var customerId = id;

    // Utiliser la fonction fetch pour envoyer une requête POST
    fetch("/findCustomer", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerId
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Customer not found or an error occurred: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            removeLoader();
            console.log(data);
            document.getElementById('customerInfo').innerHTML = prettyPrintObject(data);
            document.getElementById('customerInfo').classList.remove('hidden');
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

    let firstName = document.getElementById('inputFirstName').value ? document.getElementById('inputFirstName').value : "";
    let lastName = document.getElementById('inputLastName').value ? document.getElementById('inputLastName').value : "";
    let email = document.getElementById('customerEmail').value ? document.getElementById('customerEmail').value : "";
    let createdAtStartDate = document.getElementById('createdAtStartDate').value ? document.getElementById('createdAtStartDate').value : "";
    let createdAtEndDate = document.getElementById('createdAtEndDate').value ? document.getElementById('createdAtEndDate').value : "";
    let PMToken = document.getElementById('PMToken').value ? document.getElementById('PMToken').value : "";

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
    fetch('/searchCustomer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
                    color = "aliceblue";
                    document.querySelector('.tableContent').innerHTML += "<tr style='color: " + colorText + ";background-color: " + color + ";' class='border-b dark:border-neutral-500'><td class='whitespace-nowrap px-6 py-4'>" + data[i].id + "</td><td><button class='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' target='_blank' onclick=\"searchCustomer('" + data[i].id + "')\">GET DETAILS</button></td><td>" + data[i].firstName + "</td><td>" + data[i].lastName + "</td><td>" + data[i].phone + "</td><td>" + data[i].email + "</td><td>" + data[i].createdAt.date + "</td><td><a class='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' target='_blank' href='" + data[i].link + "'>Link to BO</a></td></tr>";

                }
            }

        })
        .catch(error => {
            console.error('Une erreur s\'est produite : ', error);
        });
}