const [
  filterContainer,
  limit,
  queryForm,
  radius,
  resultStatus,
  startLocation,
  submitBtn,
  tableBody,
  tableHead,
  typeOutcode,
  typePostcode,
] = [
  document.getElementById("filter-container"),
  document.getElementById("limit"),
  document.getElementById("query-form"),
  document.getElementById("radius"),
  document.getElementById("result-status"),
  document.getElementById("start-location"),
  document.getElementById("submit-btn"),
  document.getElementById("table-body"),
  document.getElementById("table-head"),
  document.getElementById("type-outcode"),
  document.getElementById("type-postcode"),
];

queryForm.addEventListener("submit", handleSubmitForm);

const outcodeHeadings = [
  "Outcode",
  "Longitude",
  "Latitude",
  "Northings",
  "Eastings",
  "Admin District",
  "Parish",
  "Admin County",
  "Admin Ward",
  "Country",
  "Parliamentary Constituency",
]

const postcodeHeadings = [
  "Postcode",
  "Quality",
  "Eastings",
  "Northings",
  "Country",
  "NHS HA",
  "Longitude",
  "Latitude",
  "European Electoral Region",
  "Primary Care Trust",
  "Region",
  "LSOA",
  "MSOA",
  "Incode",
  "Outcode",
  "Parliamentary Constituency",
  "Parliamentary Constituency 2024",
  "Admin District",
  "Parish",
  "Admin County",
  "Date of introduction",
  "Admin Ward",
  "CED",
  "CCG",
  "NUTS",
  "PFA",
  "Codes",
  "Distance",
]

const postcodeCodesHeading = [
  "Admin District",
  "Admin County",
  "Admin Ward",
  "Parish",
  "Parliamentary Constituency",
  "Parliamentary Constituency 2024",
  "CCG",
  "CCG ID",
  "CED",
  "NUTS",
  "LSOA",
  "MSOA",
  "LAU2",
  "PFA",
];

const resultFilters = [
  "Admin District",
];

let currentResult;

async function handleSubmitForm(event) {
  event.preventDefault();

  const requestType = [typeOutcode, typePostcode]
    .filter(t => t.checked)[0].value;

  const queries = [["limit", limit.value], ["radius", radius.value]]
    .filter(v => !!v[1]);

  const queryParams = queries.length > 0 ?
    `?${queries[0][0]}=${queries[0][1]}${queries[1] ? 
      queries[1][0] + '=' + queries[1][1] : 
      ''
    }` : 
    '';

  await fetch(`https://api.postcodes.io/${
    requestType
  }s/${
    startLocation.value
  }/nearest${
    queryParams
  }`)
  .catch(error => {
    console.log("Fetch error:", error)
    throw new Error("We couldn't make the request. Please confirm that you are connected to the internet and try again.")
  })
  .then (async (res) => {
    let codes = await res.json();
    if (codes.error) {
      throw new Error(
        codes.status === 404 ?
          `We could not find any ${requestType}s matching "${startLocation.value}"` :
          codes.error
      );
    }
    resultStatus.classList.toggle("hidden", true);
    currentResult = codes.result;
    showFilters(requestType);
    buildResultTable(currentResult, requestType);
    console.log(currentResult);
  })
  .catch(error => {
    console.log("Response error:", error)
    resultStatus.textContent = `${error}`.replace(/[a-zA-Z]+: /, "");
  })
}

function buildResultTable(result, requestType, filters=[...resultFilters]) {
  let tableHeadings = requestType === "postcode" 
    ? [...postcodeHeadings] 
    : requestType === "outcode"
    ? [...outcodeHeadings]
    : [...postcodeHeadings];
  
  tableHeadings = tableHeadings.filter(h => filters.includes(h));
  
  const [tHeadingsLength, resultLength] = [tableHeadings.length, result.length];

  tableHead.textContent = "";
  tableBody.textContent = "";

  for (let i = 0; i < tHeadingsLength; i++) {
    const th = document.createElement("th");
    th.appendChild(document.createTextNode(tableHeadings[i]));
    tableHead.appendChild(th);
  }

  for (let i = 0; i < resultLength; i++) {
    const tr = document.createElement("tr");
    for (j = 0; j < tHeadingsLength; j++) {
      const td = document.createElement("td");
      let value = result[i][toSnakeCase(tableHeadings[j])];
      value = (Array.isArray(value) && value.length > 0) || (!Array.isArray(value) && value) ? value : "None";
      td.appendChild(document.createTextNode(value));
      tr.appendChild(td);
    }
    tableBody.appendChild(tr);
  }
}

function showFilters(requestType) {
  let tableHeadings = requestType === "postcode" 
    ? [...postcodeHeadings] 
    : requestType === "outcode"
    ? [...outcodeHeadings]
    : [...postcodeHeadings];
  const tHeadingsLength = tableHeadings.length;

  resultFilters.push(tableHeadings[0]);

  filterContainer.textContent = "";
  filterContainer.classList.toggle("hidden", false);

  const summary = document.createElement("summary");
  summary.classList.add("flex");
  summary.appendChild(document.createTextNode("Filters: "));
  filterContainer.appendChild(summary);

  for (let i = 0; i < tHeadingsLength; i++) {
    const checkbox = document.createElement("input");
    const label = document.createElement("label");

    const name = toSnakeCase(tableHeadings[i]);
    const value = tableHeadings[i];

    checkbox.type = "checkbox";
    checkbox.id = name;
    checkbox.name = name;
    checkbox.value = value;
    checkbox.checked = resultFilters.includes(value);
    checkbox.disabled = value === "Admin District" || i === 0;
    checkbox.addEventListener("change", () => {
      if (resultFilters.includes(value)) {
        resultFilters.splice(resultFilters.indexOf(value), 1);
      } else {
        resultFilters.push(value);
      }
      buildResultTable(currentResult, requestType);
    });

    label.htmlFor = name;
    label.appendChild(document.createTextNode(value));

    filterContainer.appendChild(checkbox);
    filterContainer.appendChild(label);
  }
}

function toSnakeCase(string) {
  if (typeof string !== "string") throw new Error(`Invalid argument. ${string} is not a string.`);
  const searchString = /^[a-zA-Z]|-[a-zA-Z]|_[a-zA-Z]| [a-zA-Z]|[A-Z]/g;
  const replaceString = (c, offset) => {
    const char = (c[c.length - 1]);
    if (offset == 0) {return char;} else {return `_${char}`;}
  };
  return string.toLocaleLowerCase().replace(searchString, replaceString);
}
