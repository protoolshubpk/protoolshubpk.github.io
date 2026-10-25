
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  WHATSAPP_PHONE
} from "./config.js";

const $ = id => document.getElementById(id);
const ADMIN_MODE =
  new URLSearchParams(location.search).get("admin") === "1";

const CART_KEY = "pth_cart_v3";

const fallbackProducts = [
  {id:"chatgpt-plus",name:"ChatGPT Plus",category:"AI Tools",icon:"✦",price:600,description:"AI productivity tools.",duration:"1 month",featured:true,is_active:true,sort_order:1},
  {id:"capcut-pro",name:"CapCut Pro",category:"Video & Media",icon:"▶",price:799,description:"Video editing tools.",duration:"Confirm duration",featured:true,is_active:true,sort_order:2},
  {id:"canva-pro",name:"Canva Pro",category:"Design",icon:"▧",price:1000,description:"Design resources and templates.",duration:"1 year",featured:true,is_active:true,sort_order:3},
  {id:"quillbot",name:"QuillBot",category:"Writing",icon:"✎",price:350,description:"Writing assistance.",duration:"1 month",featured:false,is_active:true,sort_order:4},
  {id:"grammarly",name:"Grammarly",category:"Writing",icon:"✓",price:300,description:"Grammar and writing assistance.",duration:"1 month",featured:false,is_active:true,sort_order:5},
  {id:"stealthwriter",name:"StealthWriter",category:"Writing",icon:"✒",price:1500,description:"Writing utility.",duration:"1 month",featured:false,is_active:true,sort_order:6},
  {id:"gemini-pro",name:"Gemini Pro",category:"AI Tools",icon:"✧",price:1500,description:"AI productivity tools.",duration:"Confirm terms",featured:true,is_active:true,sort_order:7},
  {id:"spotify",name:"Spotify",category:"Entertainment",icon:"♫",price:1500,description:"Music subscription.",duration:"3 months",featured:false,is_active:true,sort_order:8},
  {id:"muse-ai",name:"Muse AI",category:"AI Tools",icon:"◈",price:599,description:"AI tools.",duration:"1 month",featured:false,is_active:true,sort_order:9},
  {id:"netflix",name:"Netflix",category:"Entertainment",icon:"▶",price:500,description:"Streaming subscription.",duration:"1 month",featured:false,is_active:true,sort_order:10},
  {id:"claude-pro",name:"Claude Pro",category:"AI Tools",icon:"✺",price:2500,description:"AI assistant subscription.",duration:"Confirm terms",featured:true,is_active:true,sort_order:11}
];

let supabase = null;
let products = [];
let category = "All";
let searchText = "";
let cart = [];

try {
  cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  if (!Array.isArray(cart)) cart = [];
} catch {
  cart = [];
}

const money = n =>
  Number(n || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0
  });

function isConfigured() {
  return /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/.test(SUPABASE_URL) &&
    typeof SUPABASE_ANON_KEY === "string" &&
    SUPABASE_ANON_KEY.length > 20 &&
    !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");
}

async function initSupabase() {
  if (!isConfigured()) return false;

  const { createClient } = await import(
    "https://esm.sh/@supabase/supabase-js@2"
  );

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return true;
}

function notify(message) {
  const el = $("toast");

  if (!el) {
    alert(message);
    return;
  }

  el.textContent = message;
  el.classList.add("show");

  setTimeout(() => el.classList.remove("show"), 2500);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/* ================= STORE PRODUCTS ================= */

async function loadStoreProducts() {
  if (supabase) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && Array.isArray(data) && data.length) {
      products = data;
      return;
    }

    if (error && $("catalogMessage")) {
      $("catalogMessage").hidden = false;
      $("catalogMessage").textContent =
        "Live catalogue unavailable. Showing backup products.";
    }
  }

  products = fallbackProducts;
}

function renderCategories() {
  const box = $("categories");
  if (!box) return;

  box.replaceChildren();

  const categories = [
    "All",
    ...new Set(products.map(p => p.category).filter(Boolean))
  ];

  categories.forEach(c => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "category-chip" + (category === c ? " active" : "");
    btn.textContent = c === "All" ? "All products" : c;

    btn.addEventListener("click", () => {
      category = c;
      renderCategories();
      renderProducts();
    });

    box.appendChild(btn);
  });
}

function renderProducts() {
  const grid = $("grid");
  if (!grid) return;

  let list = products.filter(p =>
    (category === "All" || p.category === category) &&
    (String(p.name) + " " + String(p.category))
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  const sort = $("sort")?.value || "featured";

  if (sort === "price-low") {
    list.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sort === "price-high") {
    list.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sort === "name") {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    list.sort((a, b) =>
      Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
      Number(a.sort_order || 999) - Number(b.sort_order || 999)
    );
  }

  grid.replaceChildren();

  list.forEach(p => {
    const card = document.createElement("article");
    card.className = "product-card";

    const top = document.createElement("div");
    top.className = "product-card-top";

    const media = document.createElement("div");
    media.className = "product-media";

    if (p.image_url) {
      const img = document.createElement("img");
      img.src = p.image_url;
      img.alt = p.name;
      img.loading = "lazy";

      img.onerror = () => {
        img.remove();
        media.textContent = p.icon || "✦";
      };

      media.appendChild(img);
    } else {
      media.textContent = p.icon || "✦";
    }

    top.appendChild(media);

    if (p.featured) {
      const badge = document.createElement("span");
      badge.className = "product-badge";
      badge.textContent = "FEATURED";
      top.appendChild(badge);
    }

    const title = document.createElement("h3");
    title.textContent = p.name;

    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = p.description || "";

    const duration = document.createElement("span");
    duration.className = "product-duration";
    duration.textContent = p.duration || p.category || "";

    const bottom = document.createElement("div");
    bottom.className = "product-bottom";

    const price = document.createElement("div");
    price.className = "product-price";
    price.innerHTML =
      "Rs " + money(p.price) +
      "<small>PKR · listed price</small>";

    const add = document.createElement("button");
    add.type = "button";
    add.className = "add-btn";
    add.textContent = "+";
    add.setAttribute("aria-label", "Add " + p.name + " to cart");
    add.addEventListener("click", () => addToCart(p.id));

    bottom.append(price, add);
    card.append(top, title, description, duration, bottom);
    grid.appendChild(card);
  });

  if ($("productCount")) $("productCount").textContent = list.length;
  if ($("noresults")) $("noresults").hidden = list.length > 0;
}

function addToCart(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;

  const item = cart.find(x => String(x.id) === String(id));

  if (item) {
    item.quantity = Number(item.quantity || 0) + 1;
  } else {
    cart.push({ id: p.id, quantity: 1 });
  }

  saveCart();
  renderCart();
  notify("Added to cart: " + p.name);
}

function changeQuantity(id, amount) {
  const item = cart.find(x => String(x.id) === String(id));
  if (!item) return;

  item.quantity = Number(item.quantity) + amount;

  if (item.quantity <= 0) {
    cart = cart.filter(x => String(x.id) !== String(id));
  }

  saveCart();
  renderCart();
}

function renderCart() {
  const box = $("cartitems");
  if (!box) return;

  cart = cart.filter(item =>
    products.some(p => String(p.id) === String(item.id)) &&
    Number(item.quantity) > 0
  );

  saveCart();
  box.replaceChildren();

  let total = 0;
  let count = 0;

  if (!cart.length) {
    const empty = document.createElement("div");
    empty.className = "cart-empty";
    empty.textContent = "Your cart is empty. Add a product to get started.";
    box.appendChild(empty);
  }

  cart.forEach(item => {
    const p = products.find(x => String(x.id) === String(item.id));
    if (!p) return;

    total += Number(p.price) * Number(item.quantity);
    count += Number(item.quantity);

    const row = document.createElement("div");
    row.className = "cart-line";

    const name = document.createElement("span");
    name.className = "cart-line-name";
    name.textContent = p.name;

    const price = document.createElement("span");
    price.className = "cart-line-price";
    price.textContent = "Rs " + money(p.price * item.quantity);

    const quantity = document.createElement("div");
    quantity.className = "quantity-control";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.addEventListener("click", () =>
      changeQuantity(item.id, -1)
    );

    const number = document.createElement("span");
    number.textContent = item.quantity;

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.addEventListener("click", () =>
      changeQuantity(item.id, 1)
    );

    quantity.append(minus, number, plus);
    row.append(name, price, quantity);
    box.appendChild(row);
  });

  if ($("count")) $("count").textContent = count;
  if ($("total")) $("total").textContent = money(total);
  if ($("checkout")) $("checkout").disabled = cart.length === 0;
}

function sendWhatsApp(message) {
  const phone = String(WHATSAPP_PHONE || "").replace(/\D/g, "");

  if (!phone) {
    alert("Please configure the WhatsApp number in config.js.");
    return;
  }

  window.open(
    "https://wa.me/" + phone + "?text=" + encodeURIComponent(message),
    "_blank",
    "noopener,noreferrer"
  );
}

function setupStore() {
  $("search")?.addEventListener("input", e => {
    searchText = e.target.value;
    renderProducts();
  });

  $("sort")?.addEventListener("change", renderProducts);

  $("clearFilters")?.addEventListener("click", () => {
    category = "All";
    searchText = "";
    if ($("search")) $("search").value = "";
    renderCategories();
    renderProducts();
  });

  $("cartNav")?.addEventListener("click", () => {
    $("cart")?.scrollIntoView({ behavior: "smooth" });
  });

  $("checkout")?.addEventListener("click", () => {
    if (!cart.length) return;

    const lines = cart.map(item => {
      const p = products.find(x => String(x.id) === String(item.id));
      return p
        ? p.name + " x " + item.quantity +
          " — Rs " + money(p.price * item.quantity)
        : "";
    }).filter(Boolean);

    const total = cart.reduce((sum, item) => {
      const p = products.find(x => String(x.id) === String(item.id));
      return sum + (p ? Number(p.price) * Number(item.quantity) : 0);
    }, 0);

    sendWhatsApp(
      "Hello Pro Tools Hub! I want to order:\n" +
      lines.join("\n") +
      "\nTotal: Rs " + money(total) +
      "\nPlease confirm availability and payment details before payment."
    );
  });

  $("fundForm")?.addEventListener("submit", e => {
    e.preventDefault();

    const amount = Number($("amount")?.value);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    sendWhatsApp(
      "Hello Pro Tools Hub. Please confirm payment instructions.\n" +
      "Method: " + ($("method")?.value || "Not selected") +
      "\nAmount: Rs " + money(amount)
    );
  });

  if ($("year")) $("year").textContent = new Date().getFullYear();
}

/* ================= ADMIN PANEL ================= */

function adminShell() {
  document.body.innerHTML = `
    <style>
      *{box-sizing:border-box}
      body{margin:0;background:#f3f6fb;color:#183451;font-family:Arial,sans-serif}
      [hidden]{display:none!important}
      .adm{max-width:1100px;margin:auto;padding:18px}
      .head{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:20px}
      .brand{font-size:23px;font-weight:800;color:#075bb8}
      .card{background:white;border:1px solid #dfe7f1;border-radius:14px;padding:18px;margin-bottom:16px}
      .adm input,.adm textarea{width:100%;padding:12px;border:1px solid #d4dfed;border-radius:8px;font:inherit}
      .adm label{display:block;font-size:13px;font-weight:bold;margin:12px 0 6px}
      .adm button,.adm a{border:0;border-radius:8px;padding:11px 14px;background:#0868cf;color:white;font-weight:bold;cursor:pointer;text-decoration:none;display:inline-block}
      .adm .secondary{background:#eaf2fc;color:#14569b}
      .adm .danger{background:#ffe9e9;color:#a51e1e}
      .adm .notice{background:#fff4d9;padding:12px;border-radius:8px;margin-bottom:15px;overflow-wrap:anywhere}
      .adm .alert{background:#ffe9e9;color:#a51e1e;padding:12px;border-radius:8px;margin-bottom:15px;overflow-wrap:anywhere}
      .adm .success{background:#e4f8ed;color:#126b3e}
      .stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px}
      .stat{background:white;border:1px solid #dfe7f1;border-radius:10px;padding:14px}
      .stat strong{display:block;font-size:24px;margin-top:6px}
      .layout{display:grid;grid-template-columns:1fr 1.2fr;gap:16px;align-items:start}
      .check{display:flex;gap:8px;align-items:center;margin-top:12px}
      .check input{width:auto}
      .hint{font-size:12px;color:#6b8098;line-height:1.6}
      .row{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #e8eef6;flex-wrap:wrap}
      .info{flex:1;min-width:120px;overflow-wrap:anywhere}
      .info small{display:block;margin-top:5px;color:#6b8098}
      .actions{display:flex;gap:6px}
      @media(max-width:700px){.adm{padding:10px}.layout{grid-template-columns:1fr}.stats{gap:6px}.stat{padding:9px;font-size:12px}.stat strong{font-size:20px}.card{padding:13px}}
    </style>

    <main class="adm">
      <header class="head">
        <div class="brand">✦ Pro Tools Hub Admin</div>
        <a href="./">View Store</a>
        <button id="logoutBtn" class="secondary" hidden>Sign out</button>
      </header>

      <div id="setupAlert" class="notice" hidden></div>
      <div id="adminAlert" class="alert" hidden></div>

      <section id="loginPanel" class="card">
        <h1>Admin Login</h1>
        <p class="hint">Sign in with your existing Supabase admin account.</p>
        <form id="loginForm" class="adm">
          <label for="loginEmail">Email address</label>
          <input id="loginEmail" type="email" autocomplete="username" required>
          <label for="loginPassword">Password</label>
          <input id="loginPassword" type="password" autocomplete="current-password" required>
          <button id="loginBtn" type="submit" style="margin-top:15px">Sign in</button>
        </form>
      </section>

      <section id="dashboard" hidden>
        <div class="stats">
          <div class="stat">Total products<strong id="totalProducts">0</strong></div>
          <div class="stat">Active products<strong id="activeProducts">0</strong></div>
          <div class="stat">Featured<strong id="featuredProducts">0</strong></div>
        </div>

        <div class="layout">
          <form id="productForm" class="card adm">
            <h2 id="editorTitle">Add product</h2>
            <input id="productId" type="hidden">

            <label for="productName">Product name</label>
            <input id="productName" maxlength="120" required>

            <label for="productPrice">Price (PKR)</label>
            <input id="productPrice" type="number" min="0" step="1" required>

            <label for="productCategory">Category</label>
            <input id="productCategory" value="AI Tools" required>

            <label for="productIcon">Fallback icon</label>
            <input id="productIcon" value="✦">

            <label for="productDescription">Description (English)</label>
            <textarea id="productDescription" rows="2"></textarea>

            <label for="productDescriptionUr">Description (Urdu)</label>
            <textarea id="productDescriptionUr" rows="2"></textarea>

            <label for="productDuration">Plan / duration</label>
            <input id="productDuration" placeholder="e.g. 1 month">

            <label for="productImageUrl">Product image URL</label>
            <input id="productImageUrl" type="url" placeholder="https://...">

            <div id="imagePreviewWrap" hidden style="margin-top:10px">
              <img id="imagePreview" alt="Product preview" style="max-width:130px;max-height:100px;object-fit:contain">
            </div>

            <label for="productSort">Display order</label>
            <input id="productSort" type="number" value="50">

            <div class="check">
              <input id="productActive" type="checkbox" checked>
              <label for="productActive" style="margin:0">Active on store</label>
            </div>

            <div class="check">
              <input id="productFeatured" type="checkbox">
              <label for="productFeatured" style="margin:0">Featured product</label>
            </div>

            <button id="saveProductBtn" type="submit" style="margin-top:16px">Save product</button>
            <button id="resetFormBtn" type="button" class="secondary">Clear form</button>
          </form>

          <section class="card">
            <h2>Manage products</h2>
            <button id="refreshBtn" class="secondary" type="button">Refresh</button>
            <div id="adminProductList" style="margin-top:12px">Sign in to load products.</div>
          </section>
        </div>

        <section class="card">
          <h2>Orders and payments</h2>
          <p class="hint">
            Order records and payment verification are not enabled yet.
            WhatsApp checkout is only a request, not proof of payment.
          </p>
        </section>
      </section>
    </main>
  `;
}

function adminMessage(message, success = false) {
  const el = $("adminAlert");
  el.textContent = message;
  el.classList.toggle("success", success);
  el.hidden = false;
}

function clearAdminMessage() {
  $("adminAlert").hidden = true;
}

function showDashboard(show) {
  $("dashboard").hidden = !show;
  $("loginPanel").hidden = show;
  $("logoutBtn").hidden = !show;
}

function setProductForm(p = null) {
  $("productId").value = p?.id || "";
  $("productName").value = p?.name || "";
  $("productPrice").value = p?.price ?? "";
  $("productCategory").value = p?.category || "AI Tools";
  $("productIcon").value = p?.icon || "✦";
  $("productDescription").value = p?.description || "";
  $("productDescriptionUr").value = p?.description_ur || "";
  $("productDuration").value = p?.duration || "";
  $("productImageUrl").value = p?.image_url || "";
  $("productSort").value = p?.sort_order ?? 50;
  $("productActive").checked = p?.is_active !== false;
  $("productFeatured").checked = Boolean(p?.featured);

  $("editorTitle").textContent = p ? "Edit product" : "Add product";
  $("saveProductBtn").textContent = p ? "Save changes" : "Save product";

  if (p?.image_url) {
    $("imagePreview").src = p.image_url;
    $("imagePreviewWrap").hidden = false;
  } else {
    $("imagePreview").removeAttribute("src");
    $("imagePr
