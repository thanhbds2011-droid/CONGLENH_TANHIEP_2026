const API_URL = "https://script.google.com/macros/s/AKfycbzsBlbmfyzecmKurNXbyz4oFCEvV9y472P4xbiba-gvE9a3yOSmzNHvF_aSe0HEMrt0/exec";
const API_TOKEN = "CONGLENH_TANHIEP_2026";
const CURRENT_VERSION = "133";

let DU_LIEU_NHAT_KY = [];

/* ================= API JSONP ================= */

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

/* ================= ĐIỀU HƯỚNG ================= */

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

  if (id === "nhatky") {
    damBaoOCtimKiemNhatKy();
    taiBaoCao();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ================= DASHBOARD KHÔNG HIỆN LỖI KHI CHỜ ================= */

function taiDashboard() {
  const ids = [
    "soTiepTheoCL",
    "tongCL",
    "huyCL",
    "soTiepTheoGGT",
    "tongGGT",
    "huyGGT"
  ];

  const cache = localStorage.getItem("dashboard_cache");

  if (cache) {
    try {
      const data = JSON.parse(cache);
      capNhatSoDashboard(data);
    } catch (e) {}
  } else {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerText = "...";
    });
  }

  goiApi("dashboard", {}, function (res) {
    if (!res || !res.ok || !res.data) {
      console.log("Dashboard chưa phản hồi, giữ dữ liệu cũ.");
      return;
    }

    localStorage.setItem("dashboard_cache", JSON.stringify(res.data));
    capNhatSoDashboard(res.data);
  });
}

function capNhatSoDashboard(data) {
  ganText("soTiepTheoCL", data.soTiepTheoCL ?? "-");
  ganText("tongCL", data.tongCL ?? 0);
  ganText("huyCL", data.huyCL ?? 0);

  ganText("soTiepTheoGGT", data.soTiepTheoGGT ?? "-");
  ganText("tongGGT", data.tongGGT ?? 0);
  ganText("huyGGT", data.huyGGT ?? 0);
}

function ganText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

/* ================= FORM CẤP VĂN BẢN ================= */

function doiLoaiGiay() {
  const loai = document.getElementById("loaiGiay").value;

  document.getElementById("formCL").style.display =
    loai === "CONG_LENH" ? "block" : "none";

  document.getElementById("formGGT").style.display =
    loai === "GIAY_GIOI_THIEU" ? "block" : "none";

  anLichSuCapLai();
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
  const params = layThongTinFormCapVanBan();
  const ketqua = document.getElementById("ketqua");

  ketqua.style.display = "block";
  ketqua.innerHTML = "⏳ Đang kiểm tra và xuất PDF...";

  goiApi("xuat", params, function (res) {
    if (res && res.conflict) {
      hienCanhBaoTrungCongLenh(res.data, params);
      return;
    }

    if (!res || !res.ok) {
      ketqua.innerHTML = "❌ " + ((res && res.message) ? res.message : "Xuất PDF thất bại.");
      return;
    }

    hienKetQuaXuatThanhCong(res);
    resetForm();
    taiDashboard();
  });
}
let DU_LIEU_TRUNG_CL = null;
let PARAMS_DANG_CAP = null;

function layThongTinFormCapVanBan() {
  const loaiGiay = document.getElementById("loaiGiay").value;

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

  return params;
}

function hienCanhBaoTrungCongLenh(vb, params) {
  DU_LIEU_TRUNG_CL = vb;
  PARAMS_DANG_CAP = params;

  const ketqua = document.getElementById("ketqua");

  ketqua.style.display = "block";
  ketqua.innerHTML = `
    <div class="conflict-box">
      <h3>⚠️ Phát hiện công lệnh đang hiệu lực</h3>

      <p><b>Đồng chí:</b> ${vb.dongChi || ""}</p>
      <p><b>Công lệnh số:</b> ${vb.so || ""}</p>
      <p><b>Thời gian đã cấp:</b> ${vb.ngayDi || ""} → ${vb.ngayVe || ""}</p>
      <p><b>Lý do trùng:</b> ${vb.lyDoTrung || "Khoảng thời gian chồng lấn"}</p>

      <div class="conflict-actions">
        <button type="button" onclick="xemCongLenhTrung()">👁 Xem</button>
        <button type="button" onclick="thuHoiVaCapLaiCongLenh()">♻️ Thu hồi để cấp lại số ${vb.so}</button>
        <button type="button" onclick="capCongLenhMoiBoQuaTrung()">➕ Cấp số mới</button>
        <button type="button" onclick="dongCanhBaoTrung()">❌ Đóng</button>
      </div>
    </div>
  `;

  ketqua.scrollIntoView({ behavior: "smooth", block: "center" });
}

function xemCongLenhTrung() {
  if (!DU_LIEU_TRUNG_CL || !DU_LIEU_TRUNG_CL.linkFile) {
    alert("Không tìm thấy link PDF công lệnh cũ.");
    return;
  }

  window.open(DU_LIEU_TRUNG_CL.linkFile, "_blank");
}

function thuHoiVaCapLaiCongLenh() {
  if (!DU_LIEU_TRUNG_CL || !PARAMS_DANG_CAP) {
    alert("Không có dữ liệu công lệnh cần thu hồi.");
    return;
  }

  const lyDoHuy = prompt(
    "Nhập lý do thu hồi công lệnh số " + DU_LIEU_TRUNG_CL.so + ":",
    "Nhập sai thông tin, thu hồi để cấp lại"
  );

  if (!lyDoHuy) {
    alert("Chưa nhập lý do thu hồi.");
    return;
  }

  if (!confirm("Xác nhận thu hồi và cấp lại công lệnh số " + DU_LIEU_TRUNG_CL.so + "?\n\nSố công lệnh sẽ được giữ nguyên.")) {
    return;
  }

  const ketqua = document.getElementById("ketqua");
  ketqua.innerHTML = "⏳ Đang thu hồi và cấp lại công lệnh số " + DU_LIEU_TRUNG_CL.so + "...";

  const params = {
    ...PARAMS_DANG_CAP,
    row: DU_LIEU_TRUNG_CL.row,
    soCu: DU_LIEU_TRUNG_CL.so,
    lyDoHuy: lyDoHuy
  };

  goiApi("thuhoi_caplai_cl", params, function(res) {
    if (!res || !res.ok) {
      ketqua.innerHTML = "❌ " + ((res && res.message) ? res.message : "Không thu hồi/cấp lại được công lệnh.");
      return;
    }

    hienKetQuaXuatThanhCong(res);
    resetForm();
    taiDashboard();
  });
}

function capCongLenhMoiBoQuaTrung() {
  if (!PARAMS_DANG_CAP) {
    alert("Không có dữ liệu để cấp mới.");
    return;
  }

  if (!confirm("Xác nhận vẫn cấp công lệnh mới?\n\nCông lệnh cũ sẽ được giữ nguyên.")) {
    return;
  }

  const ketqua = document.getElementById("ketqua");
  ketqua.innerHTML = "⏳ Đang cấp công lệnh mới...";

  const params = {
    ...PARAMS_DANG_CAP,
    boQuaTrung: "1"
  };

  goiApi("xuat", params, function(res) {
    if (!res || !res.ok) {
      ketqua.innerHTML = "❌ " + ((res && res.message) ? res.message : "Không cấp được công lệnh mới.");
      return;
    }

    hienKetQuaXuatThanhCong(res);
    resetForm();
    taiDashboard();
  });
}

function dongCanhBaoTrung() {
  const ketqua = document.getElementById("ketqua");

  ketqua.style.display = "none";
  ketqua.innerHTML = "";

  DU_LIEU_TRUNG_CL = null;
  PARAMS_DANG_CAP = null;
}

function hienKetQuaXuatThanhCong(res) {
  const ketqua = document.getElementById("ketqua");

  ketqua.style.display = "block";
  ketqua.innerHTML =
    "✅ " + res.message +
    "<br><br><a class='link-btn' href='" + res.data.linkFile + "' target='_blank'>📄 Mở file PDF</a>" +
    "<br><button class='share-btn' onclick=\"chiaSePdf('" + res.data.linkFile + "', '" + res.data.tenFile + "')\">📲 Chia sẻ qua Zalo</button>";
}

function layThongTinFormCapVanBan() {
  const loaiGiay = document.getElementById("loaiGiay").value;

  const params = {
    loaiGiay,
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

  return params;
}

function hienCanhBaoTrungCongLenh(vb, params) {
  DU_LIEU_TRUNG_CL = vb;
  PARAMS_DANG_CAP = params;

  const ketqua = document.getElementById("ketqua");

  ketqua.style.display = "block";
  ketqua.innerHTML = `
    <div class="conflict-box">
      <h3>⚠️ Phát hiện công lệnh đang hiệu lực</h3>

      <p><b>Đồng chí:</b> ${vb.dongChi || ""}</p>
      <p><b>Công lệnh số:</b> ${vb.so || ""}</p>
      <p><b>Thời gian đã cấp:</b> ${vb.ngayDi || ""} → ${vb.ngayVe || ""}</p>
      <p><b>Lý do trùng:</b> ${vb.lyDoTrung || "Khoảng thời gian chồng lấn"}</p>

      <div class="conflict-actions">
        <button type="button" onclick="xemCongLenhTrung()">👁 Xem</button>
        <button type="button" onclick="suaCongLenhTrung()">✏️ Sửa số ${vb.so}</button>
        <button type="button" onclick="capCongLenhMoiBoQuaTrung()">➕ Cấp số mới</button>
        <button type="button" onclick="dongCanhBaoTrung()">❌ Đóng</button>
      </div>
    </div>
  `;

  ketqua.scrollIntoView({ behavior: "smooth", block: "center" });
}

function xemCongLenhTrung() {
  if (!DU_LIEU_TRUNG_CL || !DU_LIEU_TRUNG_CL.linkFile) {
    alert("Không tìm thấy link PDF công lệnh cũ.");
    return;
  }

  window.open(DU_LIEU_TRUNG_CL.linkFile, "_blank");
}

function suaCongLenhTrung() {
  if (!DU_LIEU_TRUNG_CL || !PARAMS_DANG_CAP) {
    alert("Không có dữ liệu công lệnh cần sửa.");
    return;
  }

  const lyDoSua = prompt(
    "Nhập lý do sửa công lệnh số " + DU_LIEU_TRUNG_CL.so + ":",
    "Nhập sai thông tin, cần điều chỉnh lại"
  );

  if (!lyDoSua) {
    alert("Chưa nhập lý do sửa.");
    return;
  }

  if (!confirm("Xác nhận sửa công lệnh số " + DU_LIEU_TRUNG_CL.so + "?\n\nSố công lệnh sẽ được giữ nguyên.")) {
    return;
  }

  const ketqua = document.getElementById("ketqua");
  ketqua.innerHTML = "⏳ Đang sửa công lệnh số " + DU_LIEU_TRUNG_CL.so + "...";

  const params = {
    ...PARAMS_DANG_CAP,
    row: DU_LIEU_TRUNG_CL.row,
    lyDoSua
  };

  goiApi("sua_cl", params, function(res) {
    if (res && res.conflict) {
      hienCanhBaoTrungCongLenh(res.data, params);
      return;
    }

    if (!res || !res.ok) {
      ketqua.innerHTML = "❌ " + ((res && res.message) ? res.message : "Không sửa được công lệnh.");
      return;
    }

    hienKetQuaXuatThanhCong(res);
    resetForm();
    taiDashboard();
  });
}

function capCongLenhMoiBoQuaTrung() {
  if (!PARAMS_DANG_CAP) {
    alert("Không có dữ liệu để cấp mới.");
    return;
  }

  if (!confirm("Xác nhận vẫn cấp công lệnh mới?\n\nCông lệnh cũ sẽ được giữ nguyên.")) {
    return;
  }

  const ketqua = document.getElementById("ketqua");
  ketqua.innerHTML = "⏳ Đang cấp công lệnh mới...";

  const params = {
    ...PARAMS_DANG_CAP,
    boQuaTrung: "1"
  };

  goiApi("xuat", params, function(res) {
    if (!res || !res.ok) {
      ketqua.innerHTML = "❌ " + ((res && res.message) ? res.message : "Không cấp được công lệnh mới.");
      return;
    }

    hienKetQuaXuatThanhCong(res);
    resetForm();
    taiDashboard();
  });
}

function dongCanhBaoTrung() {
  const ketqua = document.getElementById("ketqua");

  ketqua.style.display = "none";
  ketqua.innerHTML = "";

  DU_LIEU_TRUNG_CL = null;
  PARAMS_DANG_CAP = null;
}

function hienKetQuaXuatThanhCong(res) {
  const ketqua = document.getElementById("ketqua");

  ketqua.style.display = "block";
  ketqua.innerHTML =
    "✅ " + res.message +
    "<br><br><a class='link-btn' href='" + res.data.linkFile + "' target='_blank'>📄 Mở file PDF</a>" +
    "<br><button class='share-btn' onclick=\"chiaSePdf('" + res.data.linkFile + "', '" + res.data.tenFile + "')\">📲 Chia sẻ qua Zalo</button>";
}

function layThongTinFormCapVanBan() {
  const loaiGiay = document.getElementById("loaiGiay").value;

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

  return params;
}

function hienCanhBaoTrungCongLenh(vb, params) {
  DU_LIEU_TRUNG_CL = vb;
  PARAMS_DANG_CAP = params;

  const ketqua = document.getElementById("ketqua");

  ketqua.style.display = "block";
  ketqua.innerHTML = `
    <div class="conflict-box">
      <h3>⚠️ Phát hiện công lệnh đang hiệu lực</h3>

      <p><b>Đồng chí:</b> ${vb.dongChi || ""}</p>
      <p><b>Công lệnh số:</b> ${vb.so || ""}</p>
      <p><b>Thời gian đã cấp:</b> ${vb.ngayDi || ""} → ${vb.ngayVe || ""}</p>
      <p><b>Lý do trùng:</b> ${vb.lyDoTrung || "Khoảng thời gian chồng lấn"}</p>

      <div class="conflict-actions">
        <button type="button" onclick="xemCongLenhTrung()">👁 Xem</button>
        <button type="button" onclick="suaCongLenhTrung()">✏️ Sửa số ${vb.so}</button>
        <button type="button" onclick="capCongLenhMoiBoQuaTrung()">➕ Cấp số mới</button>
        <button type="button" onclick="dongCanhBaoTrung()">❌ Đóng</button>
      </div>
    </div>
  `;

  ketqua.scrollIntoView({ behavior: "smooth", block: "center" });
}

function xemCongLenhTrung() {
  if (!DU_LIEU_TRUNG_CL || !DU_LIEU_TRUNG_CL.linkFile) {
    alert("Không tìm thấy link PDF công lệnh cũ.");
    return;
  }

  window.open(DU_LIEU_TRUNG_CL.linkFile, "_blank");
}

function suaCongLenhTrung() {
  if (!DU_LIEU_TRUNG_CL || !PARAMS_DANG_CAP) {
    alert("Không có dữ liệu công lệnh cần sửa.");
    return;
  }

  const lyDoSua = prompt(
    "Nhập lý do sửa công lệnh số " + DU_LIEU_TRUNG_CL.so + ":",
    "Nhập sai thông tin, cần điều chỉnh lại"
  );

  if (!lyDoSua) {
    alert("Chưa nhập lý do sửa.");
    return;
  }

  if (!confirm("Xác nhận sửa công lệnh số " + DU_LIEU_TRUNG_CL.so + "?\n\nSố công lệnh sẽ được giữ nguyên.")) {
    return;
  }

  const ketqua = document.getElementById("ketqua");
  ketqua.innerHTML = "⏳ Đang sửa công lệnh số " + DU_LIEU_TRUNG_CL.so + "...";

  const params = {
    ...PARAMS_DANG_CAP,
    row: DU_LIEU_TRUNG_CL.row,
    lyDoSua: lyDoSua
  };

  goiApi("sua_cl", params, function(res) {
    if (res && res.conflict) {
      hienCanhBaoTrungCongLenh(res.data, params);
      return;
    }

    if (!res || !res.ok) {
      ketqua.innerHTML = "❌ " + ((res && res.message) ? res.message : "Không sửa được công lệnh.");
      return;
    }

    hienKetQuaXuatThanhCong(res);
    resetForm();
    taiDashboard();
  });
}

function capCongLenhMoiBoQuaTrung() {
  if (!PARAMS_DANG_CAP) {
    alert("Không có dữ liệu để cấp mới.");
    return;
  }

  if (!confirm("Xác nhận vẫn cấp công lệnh mới?\n\nCông lệnh cũ sẽ được giữ nguyên.")) {
    return;
  }

  const ketqua = document.getElementById("ketqua");
  ketqua.innerHTML = "⏳ Đang cấp công lệnh mới...";

  const params = {
    ...PARAMS_DANG_CAP,
    boQuaTrung: "1"
  };

  goiApi("xuat", params, function(res) {
    if (!res || !res.ok) {
      ketqua.innerHTML = "❌ " + ((res && res.message) ? res.message : "Không cấp được công lệnh mới.");
      return;
    }

    hienKetQuaXuatThanhCong(res);
    resetForm();
    taiDashboard();
  });
}

function dongCanhBaoTrung() {
  const ketqua = document.getElementById("ketqua");
  ketqua.style.display = "none";
  ketqua.innerHTML = "";

  DU_LIEU_TRUNG_CL = null;
  PARAMS_DANG_CAP = null;
}

function hienKetQuaXuatThanhCong(res) {
  const ketqua = document.getElementById("ketqua");

  ketqua.style.display = "block";
  ketqua.innerHTML =
    "✅ " + res.message +
    "<br><br><a class='link-btn' href='" + res.data.linkFile + "' target='_blank'>📄 Mở file PDF</a>" +
    "<br><button class='share-btn' onclick=\"chiaSePdf('" + res.data.linkFile + "', '" + res.data.tenFile + "')\">📲 Chia sẻ qua Zalo</button>";
}

/* ================= KIỂM TRA - HỦY - CẤP LẠI ================= */

function kiemTraCapLai() {
  const box = document.getElementById("lichSuCapLai");
  const loaiGiay = document.getElementById("loaiGiay").value;
  const dongChi = document.getElementById("dongChi").value.trim();

  if (!dongChi) {
    alert("Vui lòng nhập họ tên trước khi kiểm tra.");
    return;
  }

  box.style.display = "block";
  box.innerHTML = "⏳ Đang kiểm tra lịch sử cấp...";

  goiApi("kiemtra_caplai", {
    loaiGiay: loaiGiay,
    dongChi: dongChi
  }, function(res) {
    if (!res || !res.ok) {
      box.innerHTML = "❌ Không kiểm tra được lịch sử.";
      return;
    }

    if (!res.found || !res.data || res.data.length === 0) {
      box.innerHTML = "✅ Chưa có văn bản đang sử dụng của người này.";
      return;
    }

    let html = "<b>⚠️ Người này đã có văn bản đang sử dụng:</b>";

    res.data.forEach(function(vb) {
      const badge = vb.loaiGiay === "GIAY_GIOI_THIEU" ? "GGT" : "CL";

      html += `
        <div class="history-item">
          <b>${badge} ${vb.so} - ${vb.dongChi}</b>
          <small>${vb.noiDung || ""}</small>
          <small>Ngày: ${vb.cotJ || ""}</small>

          <button type="button" class="warning-btn"
            onclick="moFormCapLai('${vb.loaiGiay}', '${vb.so}')">
            🔁 Hủy và cấp lại số này
          </button>
        </div>
      `;
    });

    box.innerHTML = html;
  });
}

function moFormCapLai(loaiGiay, soCu) {
  const lyDo = prompt(
    "Nhập lý do hủy số " + soCu + ":\n\nGợi ý: Mất, Rách, Sai nơi đến, Thay đổi nơi đến, Khác"
  );

  if (!lyDo) {
    alert("Chưa nhập lý do hủy.");
    return;
  }

  const ghiChu = prompt("Ghi chú thêm nếu có:", "") || "";

  if (!confirm("Xác nhận hủy số " + soCu + " và cấp lại số mới?")) {
    return;
  }

  capLaiVanBan(loaiGiay, soCu, lyDo, ghiChu);
}

function capLaiVanBan(loaiGiay, soCu, lyDoHuy, ghiChuHuy) {
  const ketqua = document.getElementById("ketqua");

  const params = {
    loaiGiay: loaiGiay,
    soCu: soCu,
    lyDoHuy: lyDoHuy,
    ghiChuHuy: ghiChuHuy,
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
  ketqua.innerHTML = "⏳ Đang hủy số cũ và cấp lại số mới...";

  goiApi("caplai", params, function(res) {
    if (!res || !res.ok) {
      ketqua.innerHTML = "❌ " + ((res && res.message) ? res.message : "Cấp lại thất bại.");
      return;
    }

    ketqua.innerHTML =
      "✅ " + res.message +
      "<br><br><a class='link-btn' href='" + res.data.linkFile + "' target='_blank'>📄 Mở file PDF mới</a>" +
      "<br><button class='share-btn' onclick=\"chiaSePdf('" + res.data.linkFile + "', '" + res.data.tenFile + "')\">📲 Chia sẻ qua Zalo</button>";

    anLichSuCapLai();
    resetForm();
    taiDashboard();

    const kq = document.getElementById("ketqua");
    if (kq) kq.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function anLichSuCapLai() {
  const box = document.getElementById("lichSuCapLai");
  if (box) {
    box.style.display = "none";
    box.innerHTML = "";
  }
}

document.addEventListener("input", function (e) {
  if (
    e.target &&
    ["dongChi", "tuoi", "chucVu", "noiDung", "noiDungGGT", "ngayDi", "ngayVe", "ngayHetHan"].includes(e.target.id)
  ) {
    anLichSuCapLai();
  }
});

document.addEventListener("change", function (e) {
  if (
    e.target &&
    ["loaiGiay", "phongKhu", "den", "noiDen"].includes(e.target.id)
  ) {
    anLichSuCapLai();
  }
});

/* ================= RESET - CHIA SẺ ================= */

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

  anLichSuCapLai();

  const inputTen = document.getElementById("dongChi");
  if (inputTen) inputTen.focus();
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

/* ================= NHẬT KÝ ================= */

function taiBaoCao() {
  damBaoOCtimKiemNhatKy();

  const box = document.getElementById("baoCaoList");
  box.innerHTML = "⏳ Đang tải báo cáo...";

  goiApi("baocao", {}, function (res) {
    if (!res || !res.ok) {
      box.innerHTML = "❌ Không tải được báo cáo.";
      return;
    }

    DU_LIEU_NHAT_KY = res.data || [];
    hienThiNhatKy(DU_LIEU_NHAT_KY);
  });
}
function locNhatKy() {

  const keyword = document.getElementById("timKiemNhatKy").value.toLowerCase().trim();

  const tuNgay = document.getElementById("tuNgay").value;
  const denNgay = document.getElementById("denNgay").value;
  const loai = document.getElementById("locLoai").value;
  const phong = document.getElementById("locPhong").value;

  const ketQua = DU_LIEU_NHAT_KY.map(function (itemPhong) {

    // Lọc theo phòng
    if (phong && itemPhong.phongKhu !== phong) {
      return null;
    }

    const nhanSuLoc = itemPhong.nhanSu.map(function (ns) {

      const danhSachLoc = ns.danhSach.filter(function (vb) {

        // Tìm kiếm
        const text = [
          itemPhong.phongKhu,
          ns.dongChi,
          vb.loaiTen,
          vb.so,
          vb.dongChi,
          vb.noiDung,
          vb.cotG,
          vb.cotH,
          vb.cotJ,
          vb.ngayVe,
          vb.ngayCapGiay,
          vb.tenFile
        ].join(" ").toLowerCase();

        if (keyword && !text.includes(keyword))
          return false;

        // Lọc loại giấy
        if (loai && vb.loaiGiay !== loai)
          return false;

        // Lọc ngày cấp
        if (tuNgay && vb.ngayCapGiay < tuNgay)
          return false;

        if (denNgay && vb.ngayCapGiay > denNgay)
          return false;

        return true;
      });

      if (danhSachLoc.length === 0)
        return null;

      return {
        ...ns,
        danhSach: danhSachLoc,
        tongCL: danhSachLoc.filter(v => v.loaiGiay === "CONG_LENH").length,
        tongGGT: danhSachLoc.filter(v => v.loaiGiay === "GIAY_GIOI_THIEU").length
      };

    }).filter(Boolean);

    if (nhanSuLoc.length === 0)
      return null;

    return {
      ...itemPhong,
      nhanSu: nhanSuLoc,
      tongCL: nhanSuLoc.reduce((s, n) => s + n.tongCL, 0),
      tongGGT: nhanSuLoc.reduce((s, n) => s + n.tongGGT, 0)
    };

  }).filter(Boolean);

  hienThiNhatKy(ketQua);
}
function toggleBoLoc() {
  const box = document.getElementById("boLocNangCao");
  if (!box) return;

  box.classList.toggle("collapsed");
}
function hienThiNhatKy(data) {
  const box = document.getElementById("baoCaoList");

  if (!data || data.length === 0) {
    box.innerHTML = "<div class='empty'>Không tìm thấy dữ liệu phù hợp.</div>";
    return;
  }

  let html = "";

  data.forEach(function (phong, i) {
    const phongId = "phong_" + i;

    html += `
      <div class="report-group">
        <div class="report-title" onclick="toggleBox('${phongId}')">
          <div class="phong-left">
            <b>📁 ${phong.phongKhu}</b>
            <small>Nhấn để xem danh sách viên chức</small>
          </div>

          <div class="phong-right">
            <span>${phong.tongCL || 0} CL</span>
            <span>${phong.tongGGT || 0} GGT</span>
          </div>
        </div>

        <div id="${phongId}" class="report-body" style="display:none;">
    `;

    phong.nhanSu.forEach(function (ns, j) {
      const nsId = "ns_" + i + "_" + j;

      html += `
        <div class="person-row" onclick="toggleBox('${nsId}')">
          <div class="left">
            <b>👤 ${ns.dongChi}</b>
            <small>Nhấn để xem văn bản đã cấp</small>
          </div>

          <div class="right">
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
          <div class="vb-mini-row" onclick="toggleBox('${vbId}')">
            <div>
              <b>${badge} ${vb.so}</b>
              <small>${vb.noiDung || ""}</small>
            </div>

            <span>${vb.cotJ || ""}</span>
          </div>

          <div id="${vbId}" class="cl-detail" style="display:none;">
            <p><b>Loại:</b> ${vb.loaiTen || ""}</p>
            <p><b>Người được cấp:</b> ${vb.dongChi || ""}</p>
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
function resetLoc() {

  document.getElementById("timKiemNhatKy").value = "";
  document.getElementById("tuNgay").value = "";
  document.getElementById("denNgay").value = "";
  document.getElementById("locLoai").selectedIndex = 0;
  document.getElementById("locPhong").selectedIndex = 0;

  hienThiNhatKy(DU_LIEU_NHAT_KY);

}
function damBaoOCtimKiemNhatKy() {
  const baoCaoList = document.getElementById("baoCaoList");
  if (!baoCaoList) return;

  if (document.getElementById("timKiemNhatKy")) return;

  const box = document.createElement("div");
  box.className = "search-box";
  box.innerHTML = `
    <input
      id="timKiemNhatKy"
      type="text"
      placeholder="🔍 Tìm tên, số CL/GGT, nội dung, phòng/khu..."
      oninput="locNhatKy()"
    >
  `;

  baoCaoList.parentNode.insertBefore(box, baoCaoList);
}

/* ================= PWA - CẬP NHẬT PHIÊN BẢN ================= */

function dangKyServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js?v=" + CURRENT_VERSION)
      .then(reg => {
        reg.update();
      })
      .catch(err => {
        console.log("Không đăng ký được service worker", err);
      });
  }
}

function kiemTraCapNhatPhienBan() {
  fetch("version.json?v=" + Date.now(), { cache: "no-store" })
    .then(res => res.json())
    .then(data => {
      if (!data.version) return;

      if (String(data.version) !== String(CURRENT_VERSION)) {
        hienThongBaoCapNhat(data.message || "Đã có phiên bản mới.");
      }
    })
    .catch(() => {});
}

function hienThongBaoCapNhat(message) {
  if (document.getElementById("updateBox")) return;

  const box = document.createElement("div");
  box.id = "updateBox";
  box.className = "update-box";
  box.innerHTML = `
    🔄 ${message}
    <br><br>
    <button onclick="capNhatUngDung()">Cập nhật ngay</button>
  `;

  document.body.appendChild(box);
}

function capNhatUngDung() {
  const box = document.getElementById("updateBox");
  if (box) box.remove();

  localStorage.clear();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      const jobs = registrations.map(function(reg) {
        return reg.unregister();
      });

      Promise.all(jobs).then(function() {
        window.location.replace("index.html?v=" + Date.now());
      });
    });
  } else {
    window.location.replace("index.html?v=" + Date.now());
  }
}

/* ================= KHỞI ĐỘNG ỨNG DỤNG ================= */
window.addEventListener("load", function () {
  dangKyServiceWorker();

  doiLoaiGiay();
  taiDashboard();
  kiemTraCapNhatPhienBan();

  setInterval(function () {
    taiDashboard();
  }, 15000);

  setInterval(function () {
    kiemTraCapNhatPhienBan();
  }, 60000);
});
