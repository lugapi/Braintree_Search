function prettyPrintObject(obj) {
    var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
    var replacer = function (match, pIndent, pKey, pVal, pEnd) {
        var key = '<span class="json-key" style="color: brown">',
            val = '<span class="json-value" style="color: navy">',
            str = '<span class="json-string" style="color: olive">',
            r = pIndent || '';
        if (pKey)
            r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
        if (pVal)
            r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
        return r + (pEnd || '');
    };

    return JSON.stringify(obj, null, 3)
        .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(jsonLine, replacer);
}


function toggleCollapse(id) {
    var element = document.getElementById(id);
    if (element.classList.contains('hidden')) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

function setLoader() {
    document.querySelector('.container').style.opacity = '0.2';
    document.querySelector('#loading').removeAttribute('hidden');
}

function removeLoader() {
    document.querySelector('.container').style.opacity = '1';
    document.querySelector('#loading').setAttribute('hidden', 'hidden');
}

// Function to set date range
function setDateRange(startOffset, endOffset) {
    var endDate = new Date();
    var startDate = new Date();

    startDate.setUTCDate(startDate.getUTCDate() - startOffset);
    startDate.setUTCHours(0, 0, 0, 0);

    endDate.setUTCDate(endDate.getUTCDate() - endOffset);

    // Si l'offset de fin est 0 (aujourd'hui), inclure l'heure actuelle
    if (endOffset === 0) {
        endDate.setUTCHours(new Date().getUTCHours(), new Date().getUTCMinutes(), new Date().getUTCSeconds(), new Date().getUTCMilliseconds());
    } else {
        endDate.setUTCHours(0, 0, 0, 0);
    }

    document.getElementById('startDate').value = startDate.toISOString().slice(0, -8);
    document.getElementById('endDate').value = endDate.toISOString().slice(0, -8);
}