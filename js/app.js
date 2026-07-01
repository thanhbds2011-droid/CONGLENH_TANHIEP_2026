const API_URL = "https://script.google.com/macros/s/AKfycbzsBlbmfyzecmKurNXbyz4oFCEvV9y472P4xbiba-gvE9a3yOSmzNHvF_aSe0HEMrt0/exec";
const API_TOKEN = "CONGLENH_TANHIEP_2026";

function goiApi(action, params, callback) {
  const cbName = "cb_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

  params = params || {};
  params.action = action;
  params.token = API_TOKEN;
  params.callback = cbName;

  const query = Object.keys(params)
    .map(function(key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(params[key]);
    })
    .join("&");

  const script = document.createElement("script");
  script.src = API_URL + "?" + query;

  const timeout = setTimeout(function() {
    callback({
      ok: false,
      message: "Apps Script xử lý quá lâu hoặc chưa phản hồi."
    });

    delete window[cbName];
    script.remove();
  }, 300000);

  window[cbName] = function(response) {
    clearTimeout(timeout);
    callback(response);
    delete window[cbName];
    script.remove();
  };

  script.onerror = function() {
    clearTimeout(timeout);
    callback({
      ok: false,
      message: "Không kết nối được Apps Script."
    });

    delete window[cbName];
    script.remove();
  };

  document.body.appendChild(script);
}
function capCongLenh() {
  const ketqua = document.getElementById("ketqua");

  const params = {
    dongChi: document.getElementById("dongChi").value.trim(),
    tuoi: document.getElementById("tuoi").value.trim(),
    chucVu: document.getElementById("chucVu").value.trim(),
    diTu: document.getElementById("diTu").value.trim(),
    den: document.getElementById("den").value.trim(),
    noiDung: document.getElementById("noiDung").value.trim(),
    ngayDi: document.getElementById("ngayDi").value,
    ngayVe: document.getElementById("ngayVe").value,
    phuongTien: document.getElementById("phuongTien").value.trim(),
    giayTo: document.getElementById("giayTo").value.trim(),
    phongKhu: document.getElementById("phongKhu").value
  };

  if (
    !params.dongChi ||
    !params.chucVu ||
    !params.diTu ||
    !params.den ||
    !params.noiDung ||
    !params.ngayDi ||
    !params.ngayVe ||
    !params.phuongTien
  ) {
    ketqua.style.display = "block";
    ketqua.innerHTML = "❌ Vui lòng nhập đầy đủ thông tin bắt buộc.";
    return;
  }

  ketqua.style.display = "block";
  ketqua.innerHTML = "⏳ Đang xuất công lệnh PDF...";

  goiApi("xuat", params, function(res) {
    if (!res || !res.ok) {
      ketqua.innerHTML = "❌ " + ((res && res.message) ? res.message : "Xuất công lệnh thất bại.");
      return;
    }

    ketqua.innerHTML =
      "✅ " + res.message +
      "<br><br><a class='link-btn' href='" + res.data.linkFile + "' target='_blank'>📄 Mở file PDF</a>" +
      "<br><button class='share-btn' onclick=\"chiaSePdf('" + res.data.linkFile + "', '" + res.data.tenFile + "')\">📲 Chia sẻ qua Zalo</button>";

    resetForm();
    taiDashboard();
    taiBaoCao();
  });
}

function taiBaoCaoPhongKhu() {
  const box = document.getElementById("baoCaoList");

  if (!box) return;

  box.innerHTML = "⏳ Đang tải báo cáo...";

  goiApi("baocao", {}, function(res) {
    if (!res || !res.ok) {
      box.innerHTML = "❌ " + ((res && res.message) ? res.message : "Không tải được báo cáo.");
      return;
    }

    if (!res.data || res.data.length === 0) {
      box.innerHTML = "<div class='log-item'>Chưa có dữ liệu báo cáo.</div>";
      return;
    }

    let html = "";

    res.data.forEach(function(group, groupIndex) {
      const groupId = "group_" + groupIndex;

      html += `
        <div class="report-group">
          <div class="report-title" onclick="toggleBox('${groupId}')">
            <b>${group.phongKhu || "Chưa phân loại"}</b>
            <span>${group.tong || 0} công lệnh</span>
          </div>

          <div id="${groupId}" class="report-body" style="display:none;">
      `;

      group.danhSach.forEach(function(item, itemIndex) {
        const detailId = "detail_" + groupIndex + "_" + itemIndex;

        html += `
          <div class="person-item" onclick="toggleBox('${detailId}')">
            <b>CL ${item.soCongLenh || ""} - ${item.dongChi || ""}</b>
            <small>${item.den || ""}</small>
          </div>

          <div id="${detailId}" class="person-detail" style="display:none;">
            <p><b>Chức vụ:</b> ${item.chucVu || ""}</p>
            <p><b>Đi từ:</b> ${item.diTu || ""}</p>
            <p><b>Đến:</b> ${item.den || ""}</p>
            <p><b>Nội dung:</b> ${item.noiDung || ""}</p>
            <p><b>Ngày đi:</b> ${item.ngayDi || ""}</p>
            <p><b>Ngày về:</b> ${item.ngayVe || ""}</p>
            <p><b>Phương tiện:</b> ${item.phuongTien || ""}</p>
            <p><b>Giấy tờ:</b> ${item.giayTo || ""}</p>
            <p><b>Trạng thái:</b> ${item.trangThai || ""}</p>
            <p><b>Trạng thái in:</b> ${item.trangThaiIn || ""}</p>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    box.innerHTML = html;
  });
}

function toggleBox(id) {
  const el = document.getElementById(id);
  if (!el) return;

  el.style.display = el.style.display === "none" ? "block" : "none";
}
function showScreen(id, btn) {
  document.querySelectorAll(".screen").forEach(function(screen) {
    screen.classList.remove("active");
  });

  const screen = document.getElementById(id);
  if (screen) {
    screen.classList.add("active");
  }

  document.querySelectorAll(".nav-btn").forEach(function(button) {
    button.classList.remove("active");
  });

  if (btn) {
    btn.classList.add("active");
  }

  const titles = {
    home: "Trang chủ",
    cap: "Cấp công lệnh",
    nhatky: "Nhật ký",
    thongke: "Thống kê"
  };

  const pageTitle = document.getElementById("pageTitle");
  if (pageTitle) {
    pageTitle.innerText = titles[id] || "Công lệnh";
  }

  if (id === "nhatky") {
    taiBaoCaoPhongKhu();
  }

  if (id === "thongke" && typeof taiThongKe === "function") {
    taiThongKe();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}
function chiaSePdf(link, tenFile) {
  if (navigator.share) {
    navigator.share({
      title: tenFile || "Công lệnh",
      text: "File công lệnh PDF",
      url: link
    });
  } else {
    navigator.clipboard.writeText(link);
    alert("Đã sao chép link PDF. Anh có thể dán vào Zalo.");
  }
}
