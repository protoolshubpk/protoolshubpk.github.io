
const products = [
  {id:1,name:"ChatGPT Plus",category:"AI Tools",icon:"✦",price:600,description:"AI tools for productivity."},
  {id:2,name:"CapCut Pro",category:"Video & Media",icon:"▶",price:799,description:"Video editing tools for creators."},
  {id:3,name:"Canva Pro",category:"Design",icon:"▧",price:1000,description:"Designs, presentations and social posts."},
  {id:4,name:"QuillBot",category:"Writing",icon:"✎",price:350,description:"Writing and paraphrasing assistance."},
  {id:5,name:"Grammarly",category:"Writing",icon:"✓",price:300,description:"Grammar and writing assistance."},
  {id:6,name:"StealthWriter",category:"Writing",icon:"✒",price:1500,description:"Writing utility. Confirm plan details."},
  {id:7,name:"Gemini Pro",category:"AI Tools",icon:"✧",price:1500,description:"AI productivity tools."},
  {id:8,name:"Spotify",category:"Entertainment",icon:"♫",price:1500,description:"Music subscription."},
  {id:9,name:"Muse AI",category:"AI Tools",icon:"◈",price:599,description:"AI productivity tools."},
  {id:10,name:"Netflix",category:"Entertainment",icon:"▶",price:500,description:"Streaming subscription."},
  {id:11,name:"Claude Pro",category:"AI Tools",icon:"✺",price:2500,description:"AI assistant subscription."}
];

const $ = id => document.getElementById(id);
const phone = "923218329853";
let cart = [];
let category = "All";
let search = "";

function money(n) {
  return Number(n).toLocaleString("en-PK");
}

function renderCategories() {
  const box = $("categories");
  if (!box) return;

  box.innerHTML = "";
  ["All", ...new Set(products.map(p => p.category))].forEach(c => {
    const b = document.createElement("button");
    b.className = "category-chip" + (c === category ? " active" : "");
    b.textContent = c === "All" ? "All products" : c;
    b.onclick = () => {
      category = c;
      renderCategories();
      renderProducts();
    };
    box.appendChild(b);
  });
}

function renderProducts() {
  const grid = $("grid");
  if (!grid) return;

  const sort = $("sort")?.value || "featured";
  let list = products.filter(p =>
    (category === "All" || p.category === category) &&
    (p.name + " " + p.category).toLowerCase().includes(search.toLowerCase())
  );

  if (sort === "price-low") list.sort((a,b) => a.price-b.price);
  if (sort === "price-high") list.sort((a,b) => b.price-a.price);
  if (sort === "name") list.sort((a,b) => a.name.localeCompare(b.name));

  grid.innerHTML = "";

  list.forEach(p => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-card-top">
        <div class="product-media">${p.icon}</div>
        <span class="product-badge">DIGITAL TOOL</span>
      </div>
      <h3>${p.name}</h3>
      <p class="product-description">${p.description}</p>
      <span class="product-duration">${p.category}</span>
      <div class="product-bottom">
        <div class="price">Rs ${money(p.price)}</div>
        <button class="btn btn-primary add-product">Add to cart</button>
      </div>`;

    card.querySelector(".add-product").onclick = () => {
      const item = cart.find(x => x.id === p.id);
      if (item) item.quantity++;
      else cart.push({...p, quantity:1});
      renderCart();
    };

    grid.appendChild(card);
  });

  if ($("productCount")) $("productCount").textContent = list.length;
  if ($("noresults")) $("noresults").hidden = list.length !== 0;
}

function renderCart() {
  const box = $("cartitems");
  if (!box) return;

  box.innerHTML = "";
  let total = 0;
  let count = 0;

  cart.forEach(p => {
    total += p.price * p.quantity;
    count += p.quantity;

    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div>
        <strong>${p.name}</strong>
        <p>Rs ${money(p.price)} × ${p.quantity}</p>
      </div>
      <button class="btn btn-outline" aria-label="Remove ${p.name}">Remove</button>`;

    row.querySelector("button").onclick = () => {
      cart = cart.filter(x => x.id !== p.id);
      renderCart();
    };
    box.appendChild(row);
  });

  if (!cart.length) box.textContent = "Your cart is empty. Add a product to get started.";
  if ($("count")) $("count").textContent = count;
  if ($("total")) $("total").textContent = money(total);
}

$("search")?.addEventListener("input", e => {
  search = e.target.value;
  renderProducts();
});

$("sort")?.addEventListener("change", renderProducts);

$("clearFilters")?.addEventListener("click", () => {
  category = "All";
  search = "";
  if ($("search")) $("search").value = "";
  renderCategories();
  renderProducts();
});

$("cartNav")?.addEventListener("click", () => {
  $("cart")?.scrollIntoView({behavior:"smooth"});
});

$("checkout")?.addEventListener("click", () => {
  if (!cart.length) {
    alert("Please add a product to your cart first.");
    return;
  }

  const lines = cart.map(p =>
    `${p.name} × ${p.quantity} = Rs ${money(p.price*p.quantity)}`
  ).join("\n");

  const total = cart.reduce((sum,p) => sum+p.price*p.quantity,0);
  const message = `Hello Pro Tools Hub! I want to order:\n${lines}\nTotal: Rs ${money(total)}\nPlease confirm availability and terms.`;

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
});

$("fundForm")?.addEventListener("submit", e => {
  e.preventDefault();
  const amount = Number($("amount")?.value);
  if (!amount || amount < 1) {
    alert("Please enter a valid amount.");
    return;
  }

  const method = $("method")?.value || "Payment method not selected";
  const message = `Hello Pro Tools Hub. Please confirm payment instructions.\nMethod: ${method}\nAmount: Rs ${money(amount)}`;

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
});

if ($("year")) $("year").textContent = new Date().getFullYear();

renderCategories();
renderProducts();
renderCart();
  
