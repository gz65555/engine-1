import demoList from "./playground/.demoList.json";
const itemListDOM = document.getElementById("itemList");
const searchBarDOM = document.getElementById("searchBar");
const fullScreenDOM = document.getElementById("fullScreen");
const iframe = document.getElementById("iframe");
const items = []; // itemDOM,label
const routePrefix = "playground/";
const legacyRoutePrefix = "dist/";

Object.keys(demoList).forEach((group, groupIndex) => {
  const demos = demoList[group];
  const groupDOM = document.createElement("div");
  const titleDOM = document.createElement("div");
  const demosDOM = document.createElement("div");

  // Create modern category title
  titleDOM.innerHTML = `
    <div class="flex items-center space-x-2 mb-3">
      <div class="w-1 h-4 bg-gradient-to-b from-oasishub-500 to-oasishub-700 rounded-full"></div>
      <h3 class="category-title text-sm font-semibold uppercase tracking-wider">${group}</h3>
    </div>
  `;

  // Add spacing between groups
  if (groupIndex > 0) {
    groupDOM.classList.add("mt-6");
  }

  itemListDOM.appendChild(groupDOM);
  groupDOM.appendChild(titleDOM);
  groupDOM.appendChild(demosDOM);

  // Style the demos container
  demosDOM.classList.add("space-y-1", "mb-4");

  demos.forEach((item) => {
    const { label, src } = item;
    const itemDOM = document.createElement("a");

    itemDOM.innerHTML = `
      <div class="flex items-center space-x-3 p-3 rounded-lg demo-item group">
        <div class="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-oasishub-500 transition-colors duration-200"></div>
        <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900">${label}</span>
      </div>
    `;

    itemDOM.title = `${src}`;
    itemDOM.classList.add(
      "block",
      "cursor-pointer",
      "transition-all",
      "duration-200",
      "overflow-hidden",
      "no-underline",
      "rounded-lg"
    );

    itemDOM.onclick = function () {
      clickItem(itemDOM);
    };
    demosDOM.appendChild(itemDOM);

    items.push({
      itemDOM,
      label,
      src
    });
  });
});

searchBarDOM.oninput = () => {
  updateFilter(searchBarDOM.value);
};

fullScreenDOM.onclick = () => {
  const itemName = getItemNameFromHash();

  if (itemName) {
    location.href = new URL(`./${routePrefix}${itemName}.html`, location.href).href;
  }
};

function updateFilter(value) {
  const reg = new RegExp(value, "i");

  items.forEach(({ itemDOM, label, src }) => {
    reg.lastIndex = 0;
    if (reg.test(label) || reg.test(src)) {
      itemDOM.classList.remove("hide");
    } else {
      itemDOM.classList.add("hide");
    }
  });
}

function clickItem(itemDOM) {
  window.location.hash = `#${routePrefix}${itemDOM.title}`;
}

function getItemNameFromHash() {
  const hashPath = window.location.hash.slice(1);

  if (hashPath.startsWith(routePrefix)) {
    return hashPath.slice(routePrefix.length);
  }

  if (hashPath.startsWith(legacyRoutePrefix)) {
    return hashPath.slice(legacyRoutePrefix.length);
  }

  return "";
}

function onHashChange() {
  const itemName = getItemNameFromHash();
  const selectedItem = items.find(({ itemDOM }) => itemDOM.title === itemName);

  if (!selectedItem) {
    clickItem(items[0].itemDOM);
    return;
  }

  iframe.src = `${routePrefix}${itemName}.html`;

  items.forEach(({ itemDOM }) => {
    if (itemDOM === selectedItem.itemDOM) {
      itemDOM.classList.add("active");
    } else {
      itemDOM.classList.remove("active");
    }
  });
}

window.onhashchange = onHashChange;

// init
onHashChange();
