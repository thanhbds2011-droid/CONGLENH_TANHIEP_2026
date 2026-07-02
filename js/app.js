const API_URL = "https://script.google.com/macros/s/AKfycbzsBlbmfyzecmKurNXbyz4oFCEvV9y472P4xbiba-gvE9a3yOSmzNHvF_aSe0HEMrt0/exec";
const API_TOKEN = "CONGLENH_TANHIEP_2026";

function goiApi(action, params, callback) {
  const cbName = "cb_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

  params = params || {};
  params.action = action;
  params.token = API_TOKEN;
  params.callback = cbName;

  const query = Object.keys(params)
    .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
    .join("&");

  const script = document.createElement("script");
  script.src = API_URL + "?" + query;

  const timeout = setTimeout(function () {
    callback({ ok: false, message: "Apps Script xử lý quá lâu hoặc chưa phản hồi." });
    delete window[cbName];
    script.remove();
  }, 60000);

  window[cbName] = function (res) {
    clearTimeout(timeout);
    callback(res);
    delete window[cbName];
    script.remove();
  };

  script.onerror = function () {
    clearTimeout(timeout);
    callback({ ok: false, message: "Không kết nối được Apps Script." });
    delete window[cbName];
    script.remove();
  };

  document.body.appendChild(script);
}

function showScreen(id, btn) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));

  const screen = document.getElementById(id);
  if (screen) screen.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  const titles = {
    home: "Trang chủ",
    cap: "Cấp văn bản",
    nhatky: "Nhật ký"
  };

  document.getElementById("pageTitle").innerText = titles[id] || "Công lệnh";

  if (id === "home") taiDashboard();
  if (id === "nhatky") taiBaoCao();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function taiDashboard() {
  goiApi("dashboard", {}, function (res) {
    if (!res || !res.ok || !res.data) {
      document.getElementById("soTiepTheoCL").innerText = "Lỗi";
      document.getElementById("tongCL").innerText = "Lỗi";
      document.getElementById("huyCL").innerText = "Lỗi";
      document.getElementById("soTiepTheoGGT").innerText = "Lỗi";
      document.getElementById("tongGGT").innerText = "Lỗi";
      document.getElementById("huyGGT").innerText = "Lỗi";
      return;
    }

    document.getElementById("soTiepTheoCL").innerText = res.data.soTiepTheoCL ?? "-";
    document.getElementById("tongCL").innerText = res.data.tongCL ?? 0;
    document.getElementById("huyCL").innerText = res.data.huyCL ?? 0;

    document.getElementById("soTiepTheoGGT").innerText = res.data.soTiepTheoGGT ?? "-";
    document.getElementById("tongGGT").innerText = res.data.tongGGT ?? 0;
    document.getElementById("huyGGT").innerText = res.data.huyGGT ?? 0;
  });
}

function doiLoaiGiay() {
  const loai = document.getElementById("loaiGiay").value;

  document.getElementById("formCL").style.display =
    loai === "CONG_LENH" ? "block" : "none";

  document.getElementById("formGGT").style.display =
    loai === "GIAY_GIOI_THIEU" ? "block" : "none";
}

function chonNoiDen() {
  const den = document.getElementById("den");
  const denKhac = document.getElementById("denKhac");

  if (den.value === "Khác...") {
    denKhac.style.display = "block";
    denKhac.focus();
  } else {
    denKhac.style.display = "none";
    denKhac.value = "";
  }
}

function layNoiDenCongLenh() {
  const den = document.getElementById("den").value;
  const denKhac = document.getElementById("denKhac").value.trim();
  return den === "Khác..." ? denKhac : den;
}

function layNoiDenGGT() {
  const noiDen = document.getElementById("noiDen").value;
  const noiDenKhac = document.getElementById("noiDenKhac").value.trim();
  return noiDen === "Khác..." ? noiDenKhac : noiDen;
}

document.addEventListener("change", function (e) {
  if (e.target && e.target.id === "noiDen") {
    const box = document.getElementById("noiDenKhac");

    if (e.target.value === "Khác...") {
      box.style.display = "block";
      box.focus();
    } else {
      box.style.display = "none";
      box.value = "";
    }
  }
});

function capCongLenh() {
  const loaiGiay = document.getElementById("loaiGiay").value;
  const ketqua = document.getElementById("ketqua");

  const params = {
    loaiGiay: loaiGiay,
    dongChi: document.getElementById("dongChi").value.trim(),
    tuoi: document.getElementById("tuoi").value.trim(),
    chucVu: document.getElementById("chucVu").value.trim(),
    phongKhu: document.getElementById("phongKhu").value,
    ngayCapGiay: document.getElementById("ngayCapGiay").value
  };

  if (loaiGiay === "CONG_LENH") {
    params.diTu = document.getElementById("diTu").value.trim();
    params.den = layNoiDenCongLenh();
    params.noiDung = document.getElementById("noiDung").value.trim();
    params.ngayDi = document.getElementById("ngayDi").value;
    params.ngayVe = document.getElementById("ngayVe").value;
    params.phuongTien = document.getElementById("phuongTien").value.trim();
    params.giayTo = document.getElementById("giayTo").value.trim();
  } else {
    params.kinhGui = document.getElementById("kinhGui").value.trim();
    params.noiDen = layNoiDenGGT();
    params.noiDung = document.getElementById("noiDungGGT").value.trim();
    params.ngayHetHan = document.getElementById("ngayHetHan").value;
  }

  ketqua.style.display = "block";
  ketqua.innerHTML = "⏳ Đang xuất PDF...";

  goiApi("xuat", params, function (res) {
    if (!res || !res.ok) {
      ketqua.innerHTML = "❌ " + ((res && res.message) ? res.message : "Xuất PDF thất bại.");
      return;
    }

    ketqua.innerHTML =
      "✅ " + res.message +
      "<br><br><a class='link-btn' href='" + res.data.linkFile + "' target='_blank'>📄 Mở file PDF</a>" +
      "<br><button class='share-btn' onclick=\"chiaSePdf('" + res.data.linkFile + "', '" + res.data.tenFile + "')\">📲 Chia sẻ qua Zalo</button>";

    resetForm();
    taiDashboard();
  });
}

function resetForm() {
  document.getElementById("dongChi").value = "";
  document.getElementById("tuoi").value = "";
  document.getElementById("chucVu").value = "";

  document.getElementById("diTu").value = "TTBTXH Tân Hiệp";
  document.getElementById("den").selectedIndex = 0;
  document.getElementById("denKhac").value = "";
  document.getElementById("denKhac").style.display = "none";
  document.getElementById("noiDung").value = "";
  document.getElementById("ngayDi").value = "";
  document.getElementById("ngayVe").value = "";
  document.getElementById("phuongTien").value = "";
  document.getElementById("giayTo").value = "";

  document.getElementById("kinhGui").value = "";
  document.getElementById("noiDen").selectedIndex = 0;
  document.getElementById("noiDenKhac").value = "";
  document.getElementById("noiDenKhac").style.display = "none";
  document.getElementById("noiDungGGT").value = "";
  document.getElementById("ngayHetHan").value = "";

  document.getElementById("ngayCapGiay").value = "";
  document.getElementById("phongKhu").selectedIndex = 0;
  document.getElementById("dongChi").focus();
}

function chiaSePdf(link, tenFile) {
  if (navigator.share) {
    navigator.share({
      title: tenFile || "Văn bản",
      text: "File PDF",
      url: link
    });
  } else {
    navigator.clipboard.writeText(link);
    alert("Đã sao chép link PDF. Anh dán vào Zalo để gửi.");
  }
}

function taiBaoCao() {
  const box = document.getElementById("baoCaoList");
  box.innerHTML = "⏳ Đang tải báo cáo...";

  goiApi("baocao", {}, function (res) {
    if (!res || !res.ok) {
      box.innerHTML = "❌ Không tải được báo cáo.";
      return;
    }

    if (!res.data || res.data.length === 0) {
      box.innerHTML = "<div class='empty'>Chưa có dữ liệu.</div>";
      return;
    }

    let html = "";

    res.data.forEach(function (phong, i) {
      const phongId = "phong_" + i;

      html += `
        <div class="report-group">
          <div class="report-title" onclick="toggleBox('${phongId}')">
            <b>📁 ${phong.phongKhu}</b>
            <div>
              <span>${phong.tongCL || 0} công lệnh</span>
              <span>${phong.tongGGT || 0} giấy giới thiệu</span>
            </div>
          </div>

          <div id="${phongId}" class="report-body" style="display:none;">
      `;

      phong.nhanSu.forEach(function (ns, j) {
        const nsId = "ns_" + i + "_" + j;

        html += `
          <div class="person-row" onclick="toggleBox('${nsId}')">
            <b>👤 ${ns.dongChi}</b>
            <div>
              <span>${ns.tongCL || 0} CL</span>
              <span>${ns.tongGGT || 0} GGT</span>
            </div>
          </div>

          <div id="${nsId}" class="person-detail" style="display:none;">
        `;

        ns.danhSach.forEach(function (vb, k) {
          const vbId = "vb_" + i + "_" + j + "_" + k;
          const badge = vb.loaiGiay === "GIAY_GIOI_THIEU" ? "GGT" : "CL";

          html += `
            <div class="cl-row" onclick="toggleBox('${vbId}')">
              <b>${badge} ${vb.so} - ${vb.dongChi}</b>
              <small>${vb.noiDung || ""}</small>
            </div>

            <div id="${vbId}" class="cl-detail" style="display:none;">
              <p><b>Loại:</b> ${vb.loaiTen || ""}</p>
              <p><b>Chức vụ:</b> ${vb.chucVu || ""}</p>
              <p><b>${vb.loaiGiay === "GIAY_GIOI_THIEU" ? "Kính gửi" : "Đi từ"}:</b> ${vb.cotG || ""}</p>
              <p><b>${vb.loaiGiay === "GIAY_GIOI_THIEU" ? "Nơi đến" : "Đến"}:</b> ${vb.cotH || ""}</p>
              <p><b>Nội dung:</b> ${vb.noiDung || ""}</p>
              <p><b>${vb.loaiGiay === "GIAY_GIOI_THIEU" ? "Ngày hết hạn" : "Ngày đi"}:</b> ${vb.cotJ || ""}</p>
              ${vb.ngayVe ? `<p><b>Ngày về:</b> ${vb.ngayVe}</p>` : ""}
              ${vb.ngayCapGiay ? `<p><b>Ngày cấp trên giấy:</b> ${vb.ngayCapGiay}</p>` : ""}
              ${vb.phuongTien ? `<p><b>Phương tiện:</b> ${vb.phuongTien}</p>` : ""}
              ${vb.giayTo ? `<p><b>Giấy tờ:</b> ${vb.giayTo}</p>` : ""}
              ${vb.trangThai ? `<p><b>Trạng thái:</b> ${vb.trangThai}</p>` : ""}
              <p><a href="${vb.linkFile || "#"}" target="_blank">📄 Mở PDF</a></p>

              <button class="danger-btn" onclick="huyVanBan('${vb.loaiGiay}', '${vb.so}')">
                🗑️ Hủy số này
              </button>
            </div>
          `;
        });

        html += `</div>`;
      });

      html += `</div></div>`;
    });

    box.innerHTML = html;
  });
}

function toggleBox(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === "none" ? "block" : "none";
}

function huyVanBan(loaiGiay, so) {
  const tenLoai = loaiGiay === "GIAY_GIOI_THIEU" ? "giấy giới thiệu" : "công lệnh";

  if (!confirm("Anh có chắc muốn hủy " + tenLoai + " số " + so + " không?")) {
    return;
  }

  goiApi("huy", { loaiGiay: loaiGiay, so: so }, function (res) {
    if (!res || !res.ok) {
      alert("❌ " + ((res && res.message) ? res.message : "Không hủy được."));
      return;
    }

    alert("✅ " + res.message);
    taiDashboard();
    taiBaoCao();
  });
}

window.addEventListener("load", function () {
  doiLoaiGiay();
  taiDashboard();

  setInterval(function () {
    taiDashboard();
  }, 10000);
});
const CURRENT_VERSION = "104";

function kiemTraCapNhat() {
  fetch("version.json?v=" + Date.now())
    .then(res => res.json())
    .then(data => {
      if (data.version && data.version !== CURRENT_VERSION) {
        const ok = confirm("🔄 Có bản cập nhật mới. Anh có muốn cập nhật ngay không?");
        if (ok) {
          location.reload(true);
        }
      }
    })
    .catch(() => {});
}

setInterval(kiemTraCapNhat, 30000);
