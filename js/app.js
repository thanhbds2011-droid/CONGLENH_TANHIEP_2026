const API_URL = "https://script.google.com/macros/s/AKfycbzsBlbmfyzecmKurNXbyz4oFCEvV9y472P4xbiba-gvE9a3yOSmzNHvF_aSe0HEMrt0/exec";
const API_TOKEN = "CONGLENH_TANHIEP_2026";
const CURRENT_VERSION = "159";

let DU_LIEU_NHAT_KY = [];
let DU_LIEU_NHAT_KY_DANG_HIEN_THI = [];
let DU_LIEU_TRUNG_CL = null;
let PARAMS_DANG_CAP = null;
let DU_LIEU_PHONG_KHU = null;
let PARAMS_CANH_BAO_PHONG_KHU = null;
let DANG_XUAT_VAN_BAN = false;
let NOI_DUNG_TU_DONG_THEO_TEN = "";
let NOI_DEN_TU_DONG_THEO_TEN = "";

// v155 - cache + revision cho Nhật ký
const NHAT_KY_CACHE_KEY = "nhatky_cache_v155";
const NHAT_KY_FORCE_REFRESH_MS = 10 * 60 * 1000;
let DANG_TAI_NHAT_KY = false;
let NHAT_KY_CAN_LAM_MOI = false;
let NHAT_KY_REVISION_HIEN_TAI = "";
let NHAT_KY_CACHE_TIME = 0;

/* ================= API JSONP ================= */

function goiApi(action, params, callback, timeoutMs) {
  const cbName = "cb_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
  params = params || {};
  params.action = action;
  params.token = API_TOKEN;
  params.callback = cbName;

  const query = Object.keys(params)
    .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k] == null ? "" : params[k]))
    .join("&");

  const script = document.createElement("script");
  script.src = API_URL + "?" + query;
  const timeout = setTimeout(function () {
    callback({
      ok: false,
      _transportError: true,
      _timeout: true,
      message: "Hệ thống đang xử lý lâu hơn bình thường. Đang xác minh kết quả..."
    });
    delete window[cbName];
    if (script && script.parentNode) script.remove();
  }, Number(timeoutMs) || 180000);

  window[cbName] = function (res) {
    clearTimeout(timeout);
    callback(res);
    delete window[cbName];
    if (script && script.parentNode) script.remove();
  };

  script.onerror = function () {
    clearTimeout(timeout);
    callback({
      ok: false,
      _transportError: true,
      message: "Kết nối phản hồi bị gián đoạn. Đang xác minh văn bản đã được cấp hay chưa..."
    });
    delete window[cbName];
    if (script && script.parentNode) script.remove();
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

  const pageTitle = document.getElementById("pageTitle");
  if (pageTitle) pageTitle.innerText = titles[id] || "Công lệnh";

  if (id === "home") taiDashboard();

  if (id === "nhatky") {
    damBaoOCtimKiemNhatKy();
    taiBaoCao();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ================= DASHBOARD ================= */

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

function chonNoiDungCongTac() {
  const select = document.getElementById("noiDung");
  const inputKhac = document.getElementById("noiDungKhac");
  if (!select || !inputKhac) return;

  if (select.value === "Khác...") {
    inputKhac.style.display = "block";
    inputKhac.focus();
  } else {
    inputKhac.style.display = "none";
    inputKhac.value = "";
  }

  // Người dùng chủ động đổi nội dung thì không coi đây là nội dung tự động nữa.
  NOI_DUNG_TU_DONG_THEO_TEN = "";
  anLichSuCapLai();
}

function layNoiDungCongTac() {
  const select = document.getElementById("noiDung");
  const inputKhac = document.getElementById("noiDungKhac");
  if (!select) return "";
  return select.value === "Khác..."
    ? String(inputKhac?.value || "").trim()
    : String(select.value || "").trim();
}

function datNoiDungCongTac_(value, tuDong) {
  const select = document.getElementById("noiDung");
  const inputKhac = document.getElementById("noiDungKhac");
  if (!select || !inputKhac) return;

  const giaTri = String(value || "").trim();
  const coOption = Array.from(select.options).some(function(opt) {
    return opt.value === giaTri;
  });

  if (coOption && giaTri !== "Khác...") {
    select.value = giaTri;
    inputKhac.value = "";
    inputKhac.style.display = "none";
  } else if (giaTri) {
    select.value = "Khác...";
    inputKhac.value = giaTri;
    inputKhac.style.display = "block";
  } else {
    select.value = "Nuôi bệnh";
    inputKhac.value = "";
    inputKhac.style.display = "none";
  }

  NOI_DUNG_TU_DONG_THEO_TEN = tuDong ? giaTri : "";
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

function layChucVuDayDu_() {
  const chucVuCoBan = String(document.getElementById("chucVu")?.value || "").trim();
  const phongKhu = String(document.getElementById("phongKhu")?.value || "").trim();

  if (!chucVuCoBan) return "";

  // Giám đốc/Phó Giám đốc là chức danh Ban Giám đốc, không ghép thêm tên Phòng/Khu.
  if (["Giám đốc", "Phó Giám đốc"].includes(chucVuCoBan)) {
    return chucVuCoBan;
  }

  if (!phongKhu) return chucVuCoBan;

  // Tránh lặp từ "Phòng":
  // Phó Trưởng phòng + Phòng Tổ chức - Hành chính
  // => Phó Trưởng phòng Tổ chức - Hành chính.
  if (["Trưởng phòng", "Phó Trưởng phòng"].includes(chucVuCoBan) && /^Phòng\s+/i.test(phongKhu)) {
    return `${chucVuCoBan} ${phongKhu.replace(/^Phòng\s+/i, "")}`;
  }

  return `${chucVuCoBan} ${phongKhu}`;
}

function capNhatPhuongTienTheoTen_() {
  const inputTen = document.getElementById("dongChi");
  const selectPhuongTien = document.getElementById("phuongTien");
  const selectDen = document.getElementById("den");
  const inputDenKhac = document.getElementById("denKhac");
  if (!inputTen || !selectPhuongTien) return;

  const ten = chuanHoaTextTimKiem(inputTen.value);

  const mappingPhuongTien = {
    [chuanHoaTextTimKiem("Đào Duy Khấn")]: "51A-018.37",
    [chuanHoaTextTimKiem("Nguyễn Minh Tuấn")]: "51A-1896",
    [chuanHoaTextTimKiem("Võ Văn Kiệt")]: "51B-0268"
  };

  const mappingNoiDung = {
    [chuanHoaTextTimKiem("Đào Duy Khấn")]: "Chuyển viện, rước bệnh",
    [chuanHoaTextTimKiem("Nguyễn Minh Tuấn")]: "Đưa rước viên chức, người lao động đi công tác",
    [chuanHoaTextTimKiem("Võ Văn Kiệt")]: "Đưa rước Ban Giám đốc đi công tác"
  };

  const mappingNoiDen = {
    [chuanHoaTextTimKiem("Đào Duy Khấn")]: "Đồng Nai, Tp. Hồ Chí Minh",
    [chuanHoaTextTimKiem("Nguyễn Minh Tuấn")]: "Đồng Nai, Tp. Hồ Chí Minh",
    [chuanHoaTextTimKiem("Võ Văn Kiệt")]: "Đồng Nai, Tp. Hồ Chí Minh"
  };

  const phuongTien = mappingPhuongTien[ten];
  selectPhuongTien.value = phuongTien || "Tự túc";

  const noiDungGoiY = mappingNoiDung[ten] || "";
  if (noiDungGoiY) {
    datNoiDungCongTac_(noiDungGoiY, true);
  } else {
    const noiDungHienTai = layNoiDungCongTac();
    if (NOI_DUNG_TU_DONG_THEO_TEN && noiDungHienTai === NOI_DUNG_TU_DONG_THEO_TEN) {
      datNoiDungCongTac_("Nuôi bệnh", false);
    } else {
      NOI_DUNG_TU_DONG_THEO_TEN = "";
    }
  }

  const noiDenGoiY = mappingNoiDen[ten] || "";
  if (selectDen && inputDenKhac && noiDenGoiY) {
    selectDen.value = noiDenGoiY;
    inputDenKhac.value = "";
    inputDenKhac.style.display = "none";
    NOI_DEN_TU_DONG_THEO_TEN = noiDenGoiY;
  } else if (selectDen && NOI_DEN_TU_DONG_THEO_TEN && selectDen.value === NOI_DEN_TU_DONG_THEO_TEN) {
    // Khi đổi khỏi người có nơi đến tự động, chỉ trả nơi đến về mặc định nếu người dùng
    // chưa tự thay đổi lựa chọn được gợi ý trước đó.
    selectDen.selectedIndex = 0;
    if (inputDenKhac) {
      inputDenKhac.value = "";
      inputDenKhac.style.display = "none";
    }
    NOI_DEN_TU_DONG_THEO_TEN = "";
  } else if (!noiDenGoiY) {
    NOI_DEN_TU_DONG_THEO_TEN = "";
  }
}

function layThongTinFormCapVanBan() {
  const loaiGiay = document.getElementById("loaiGiay").value;

  const params = {
    loaiGiay: loaiGiay,
    dongChi: chuanHoaHoTenHienThi(document.getElementById("dongChi").value),
    tuoi: document.getElementById("tuoi").value.trim(),
    chucVu: layChucVuDayDu_(),
    phongKhu: document.getElementById("phongKhu").value,
    nguoiCap: document.getElementById("nguoiCap").value,
    ngayCapGiay: document.getElementById("ngayCapGiay").value
  };

  if (loaiGiay === "CONG_LENH") {
    params.diTu = document.getElementById("diTu").value.trim();
    params.den = layNoiDenCongLenh();
    params.noiDung = layNoiDungCongTac();
    params.ngayDi = document.getElementById("ngayDi").value;
    params.ngayVe = document.getElementById("ngayVe").value;
    params.phuongTien = document.getElementById("phuongTien").value.trim();
    params.giayTo = document.getElementById("giayTo").value.trim();
  } else {
    params.kinhGui = chuanHoaInHoa(document.getElementById("kinhGui").value);
    params.noiDen = layNoiDenGGT();
    params.noiDung = document.getElementById("noiDungGGT").value.trim();
    params.ngayHetHan = document.getElementById("ngayHetHan").value;
  }

  return params;
}

function capCongLenh() {
  if (DANG_XUAT_VAN_BAN) return;

  const params = layThongTinFormCapVanBan();
  const ketqua = document.getElementById("ketqua");
  if (!params.nguoiCap) {
    ketqua.style.display = "block";
    ketqua.innerHTML = "❌ Vui lòng chọn người cấp văn bản.";
    document.getElementById("nguoiCap").focus();
    return;
  }

  params.requestId = taoRequestIdVanBan_();
  datTrangThaiNutXuat_(true);
  ketqua.style.display = "block";
  ketqua.innerHTML = "⏳ Đang cấp văn bản. Hệ thống đã khóa nút để tránh tạo trùng, vui lòng chờ...";

  guiYeuCauCapAnToan_("xuat", params, function (res) {
    xuLyPhanHoiXuatVanBan_(res, params);
  });
}


/* ================= v154: CẤP VĂN BẢN AN TOÀN / CHỐNG BẤM LẶP ================= */

function taoRequestIdVanBan_() {
  const rand = (window.crypto && window.crypto.getRandomValues)
    ? Array.from(window.crypto.getRandomValues(new Uint32Array(2))).map(x => x.toString(36)).join("")
    : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return "VB-" + Date.now().toString(36) + "-" + rand;
}

function datTrangThaiNutXuat_(dangXuLy) {
  DANG_XUAT_VAN_BAN = !!dangXuLy;
  const btn = document.getElementById("btnXuatVanBan");
  if (!btn) return;
  btn.disabled = !!dangXuLy;
  btn.textContent = dangXuLy ? "⏳ Đang xử lý..." : "📄 Xuất PDF";
}

function guiYeuCauCapAnToan_(action, params, callback) {
  goiApi(action, params, function(res) {
    if (res && res._transportError && params && params.requestId) {
      xacMinhKetQuaYeuCau_(params.requestId, callback, res, 0);
      return;
    }
    callback(res);
  });
}

function xacMinhKetQuaYeuCau_(requestId, callback, loiGoc, lan) {
  const ketqua = document.getElementById("ketqua");
  if (ketqua) {
    ketqua.style.display = "block";
    ketqua.innerHTML = "⏳ Kết nối phản hồi bị chậm. Hệ thống đang tự kiểm tra văn bản đã được cấp chưa; vui lòng không bấm lại...";
  }

  goiApi("trang_thai_yeu_cau", { requestId: requestId }, function(st) {
    if (st && st.ok && st.done && st.result) {
      callback(st.result);
      return;
    }
    if (st && st.ok && (st.processing || st.found) && lan < 5) {
      setTimeout(function() {
        xacMinhKetQuaYeuCau_(requestId, callback, loiGoc, lan + 1);
      }, 2500);
      return;
    }
    if (lan < 2 && (!st || !st.ok)) {
      setTimeout(function() {
        xacMinhKetQuaYeuCau_(requestId, callback, loiGoc, lan + 1);
      }, 2500);
      return;
    }
    callback({
      ok: false,
      message: (loiGoc && loiGoc.message) || "Chưa xác minh được kết quả. Hãy mở Nhật ký kiểm tra trước khi cấp lại."
    });
  }, 15000);
}

/* ================= GỢI Ý PHÒNG/KHU NGƯỜI ĐƯỢC CẤP ================= */

function xuLyPhanHoiXuatVanBan_(res, params) {
  const ketqua = document.getElementById("ketqua");

  if (res && res.phongKhuConflict) {
    hienCanhBaoPhongKhu(res.data, params);
    return;
  }
  if (res && res.conflict) {
    hienCanhBaoTrungVanBan(res.data, params);
    return;
  }
  if (!res || !res.ok) {
    datTrangThaiNutXuat_(false);
    ketqua.style.display = "block";
    ketqua.innerHTML = "❌ " + ((res && res.message) ? res.message : "Xuất PDF thất bại.");
    return;
  }

  DU_LIEU_PHONG_KHU = null;
  PARAMS_CANH_BAO_PHONG_KHU = null;
  datTrangThaiNutXuat_(false);
  hienKetQuaXuatThanhCong(res);
  resetForm();
  taiDashboard();
}

function hienCanhBaoPhongKhu(data, params) {
  DU_LIEU_PHONG_KHU = data || null;
  PARAMS_CANH_BAO_PHONG_KHU = params || null;

  const ketqua = document.getElementById("ketqua");
  if (!ketqua || !data || !params) return;

  const dongChi = escapeHtml(data.dongChi || params.dongChi || "");
  const phongCu = escapeHtml(data.phongKhuDaGhiNhan || "");
  const phongMoi = escapeHtml(data.phongKhuDangChon || params.phongKhu || "");
  const vanBanGanNhat = data.soVanBanGanNhat
    ? `${escapeHtml(data.loaiTenGanNhat || "Văn bản")} số ${escapeHtml(String(data.soVanBanGanNhat))}`
    : "";
  const ngayGanNhat = data.ngayGhiNhan ? `, ngày ${escapeHtml(data.ngayGhiNhan)}` : "";

  ketqua.style.display = "block";
  ketqua.innerHTML = `
    <div class="conflict-box">
      <h3>🏷️ Kiểm tra Phòng/Khu</h3>
      <p><b>${dongChi}</b> hiện được hệ thống ghi nhận gần nhất thuộc <b>${phongCu}</b>.</p>
      <p>Bạn đang chọn <b>${phongMoi}</b> cho lần cấp này.</p>
      ${vanBanGanNhat ? `<p><small>Nguồn gợi ý: ${vanBanGanNhat}${ngayGanNhat}.</small></p>` : ""}
      <p>Bạn muốn đổi về Phòng/Khu đã ghi nhận hay vẫn cấp theo Phòng/Khu đang chọn?</p>

      <div class="conflict-actions">
        <button type="button" onclick="doiVePhongKhuDaGhiNhanVaCap()">
          ↩️ Đổi về ${phongCu} và cấp
        </button>

        <button type="button" onclick="vanCapPhongKhuDangChon()">
          ✅ Vẫn cấp ${phongMoi}
        </button>

        <button type="button" onclick="dongCanhBaoPhongKhu()">❌ Đóng</button>
      </div>
    </div>
  `;

  ketqua.scrollIntoView({ behavior: "smooth", block: "center" });
}

function guiLaiSauCanhBaoPhongKhu_(params, thongBao) {
  const ketqua = document.getElementById("ketqua");
  ketqua.style.display = "block";
  ketqua.innerHTML = thongBao || "⏳ Đang tiếp tục cấp văn bản...";
  guiYeuCauCapAnToan_("xuat", params, function (res) {
    xuLyPhanHoiXuatVanBan_(res, params);
  });
}

function doiVePhongKhuDaGhiNhanVaCap() {
  if (!DU_LIEU_PHONG_KHU || !PARAMS_CANH_BAO_PHONG_KHU) {
    alert("Không còn dữ liệu Phòng/Khu để xử lý.");
    return;
  }

  const phongCu = String(DU_LIEU_PHONG_KHU.phongKhuDaGhiNhan || "").trim();
  const select = document.getElementById("phongKhu");
  if (!phongCu || !select) return;

  const option = Array.from(select.options).find(function (opt) {
    return chuanHoaTextTimKiem(opt.value) === chuanHoaTextTimKiem(phongCu);
  });

  if (!option) {
    alert("Phòng/Khu đã ghi nhận trước đây không còn trong danh sách hiện tại: " + phongCu);
    return;
  }

  select.value = option.value;

  const params = {
    ...PARAMS_CANH_BAO_PHONG_KHU,
    phongKhu: option.value,
    boQuaPhongKhu: "1"
  };

  DU_LIEU_PHONG_KHU = null;
  PARAMS_CANH_BAO_PHONG_KHU = null;

  guiLaiSauCanhBaoPhongKhu_(
    params,
    "⏳ Đã đổi Phòng/Khu về " + option.value + ". Đang tiếp tục cấp văn bản..."
  );
}

function vanCapPhongKhuDangChon() {
  if (!DU_LIEU_PHONG_KHU || !PARAMS_CANH_BAO_PHONG_KHU) {
    alert("Không còn dữ liệu Phòng/Khu để xử lý.");
    return;
  }

  const phongDangChon = String(PARAMS_CANH_BAO_PHONG_KHU.phongKhu || "").trim();
  const params = {
    ...PARAMS_CANH_BAO_PHONG_KHU,
    boQuaPhongKhu: "1"
  };

  DU_LIEU_PHONG_KHU = null;
  PARAMS_CANH_BAO_PHONG_KHU = null;

  guiLaiSauCanhBaoPhongKhu_(
    params,
    "⏳ Đang tiếp tục cấp văn bản theo Phòng/Khu " + phongDangChon + "..."
  );
}

function dongCanhBaoPhongKhu() {
  const ketqua = document.getElementById("ketqua");
  if (ketqua) { ketqua.style.display = "none"; ketqua.innerHTML = ""; }
  DU_LIEU_PHONG_KHU = null;
  PARAMS_CANH_BAO_PHONG_KHU = null;
  datTrangThaiNutXuat_(false);
}

/* ================= CẢNH BÁO TRÙNG VĂN BẢN ================= */

function hienCanhBaoTrungVanBan(vb, params) {
  DU_LIEU_TRUNG_CL = vb;
  PARAMS_DANG_CAP = params;

  const ketqua = document.getElementById("ketqua");
  const laGGT = params && params.loaiGiay === "GIAY_GIOI_THIEU";

  const tenLoai = laGGT ? "giấy giới thiệu" : "công lệnh";
  const maLoai = laGGT ? "GGT" : "CL";

  const ngayText = laGGT
    ? (vb.ngayHetHan || vb.cotJ || vb.ngayCapGiay || "")
    : ((vb.ngayDi || vb.cotJ || "") + (vb.ngayVe ? " → " + vb.ngayVe : ""));

  ketqua.style.display = "block";
  ketqua.innerHTML = `
    <div class="conflict-box">
      <h3>⚠️ Phát hiện ${tenLoai} đang hiệu lực</h3>

      <p><b>Đồng chí:</b> ${vb.dongChi || ""}</p>
      <p><b>${maLoai} số:</b> ${vb.so || ""}</p>
      <p><b>${laGGT ? "Ngày liên quan" : "Thời gian đã cấp"}:</b> ${ngayText || ""}</p>
      <p><b>Nội dung:</b> ${vb.noiDung || ""}</p>
      <p><b>Lý do trùng:</b> ${vb.lyDoTrung || "Thông tin trùng với văn bản đang hiệu lực"}</p>
      <div class="conflict-actions">
        <button type="button" onclick="xemVanBanTrung()">👁 Xem PDF cũ</button>

        <button type="button" onclick="thuHoiVaCapLaiVanBan()">
          ♻️ Thu hồi để cấp lại số ${vb.so}
        </button>

        <button type="button" onclick="capVanBanMoiBoQuaTrung()">➕ Cấp số mới</button>

        <button type="button" onclick="dongCanhBaoTrung()">❌ Đóng</button>
      </div>
    </div>
  `;

  ketqua.scrollIntoView({ behavior: "smooth", block: "center" });
}

function xemVanBanTrung() {
  if (!DU_LIEU_TRUNG_CL || !DU_LIEU_TRUNG_CL.linkFile) {
    alert("Không tìm thấy link PDF văn bản cũ.");
    return;
  }

  window.open(DU_LIEU_TRUNG_CL.linkFile, "_blank");
}

function thuHoiVaCapLaiVanBan() {
  if (!DU_LIEU_TRUNG_CL || !PARAMS_DANG_CAP) {
    alert("Không có dữ liệu văn bản cần thu hồi.");
    return;
  }

  const laGGT = PARAMS_DANG_CAP.loaiGiay === "GIAY_GIOI_THIEU";
  const tenLoai = laGGT ? "giấy giới thiệu" : "công lệnh";
  const action = laGGT ? "thuhoi_caplai_ggt" : "thuhoi_caplai_cl";

  const lyDoHuy = prompt(
    "Nhập lý do thu hồi " + tenLoai + " số " + DU_LIEU_TRUNG_CL.so + ":",
    "Nhập sai thông tin, thu hồi để cấp lại"
  );

  if (!lyDoHuy || !lyDoHuy.trim()) {
    alert("Chưa nhập lý do thu hồi.");
    return;
  }

  const ghiChuHuy = prompt(
    "Ghi chú thêm nếu có:",
    "Thu hồi để cấp lại cùng số " + DU_LIEU_TRUNG_CL.so
  ) || "";

  const xacNhan = confirm(
    "Xác nhận thu hồi và cấp lại " + tenLoai + " số " + DU_LIEU_TRUNG_CL.so + "?\n\n" +
    "Lý do thu hồi: " + lyDoHuy.trim() + "\n" +
    "Ghi chú: " + (ghiChuHuy.trim() || "Không có") + "\n\n" +
    "Số văn bản sẽ được giữ nguyên."
  );

  if (!xacNhan) return;

  const ketqua = document.getElementById("ketqua");
  ketqua.style.display = "block";
  ketqua.innerHTML =
    "⏳ Đang thu hồi và cấp lại " + tenLoai + " số " + DU_LIEU_TRUNG_CL.so + "...";

  const params = {
    ...PARAMS_DANG_CAP,
    row: DU_LIEU_TRUNG_CL.row,
    soCu: DU_LIEU_TRUNG_CL.so,
    lyDoHuy: lyDoHuy.trim(),
    ghiChuHuy: ghiChuHuy.trim()
  };

  guiYeuCauCapAnToan_(action, params, function(res) {
    if (!res || !res.ok) {
      ketqua.innerHTML =
        "❌ " + ((res && res.message) ? res.message : "Không thu hồi/cấp lại được văn bản.");
      datTrangThaiNutXuat_(false);
      return;
    }

    datTrangThaiNutXuat_(false);
    hienKetQuaXuatThanhCong(res);

    DU_LIEU_TRUNG_CL = null;
    PARAMS_DANG_CAP = null;

    resetForm();
    taiDashboard();
  });
}

function capVanBanMoiBoQuaTrung() {
  if (!PARAMS_DANG_CAP) {
    alert("Không có dữ liệu để cấp mới.");
    return;
  }
  const laGGT = PARAMS_DANG_CAP.loaiGiay === "GIAY_GIOI_THIEU";
  const tenLoai = laGGT ? "giấy giới thiệu" : "công lệnh";
  if (!confirm("Xác nhận vẫn cấp " + tenLoai + " mới?\n\nVăn bản cũ sẽ được giữ nguyên.")) return;

  const ketqua = document.getElementById("ketqua");
  ketqua.style.display = "block";
  ketqua.innerHTML = "⏳ Đang cấp văn bản mới...";
  const params = { ...PARAMS_DANG_CAP, boQuaTrung: "1" };
  guiYeuCauCapAnToan_("xuat", params, function(res) {
    xuLyPhanHoiXuatVanBan_(res, params);
  });
}

function dongCanhBaoTrung() {
  const ketqua = document.getElementById("ketqua");
  ketqua.style.display = "none";
  ketqua.innerHTML = "";
  DU_LIEU_TRUNG_CL = null;
  PARAMS_DANG_CAP = null;
  datTrangThaiNutXuat_(false);
}

// Alias cũ để tránh lỗi nếu trình duyệt còn cache tên hàm cũ
function hienCanhBaoTrungCongLenh(vb, params) {
  hienCanhBaoTrungVanBan(vb, params);
}

function xemCongLenhTrung() {
  xemVanBanTrung();
}

function thuHoiVaCapLaiCongLenh() {
  thuHoiVaCapLaiVanBan();
}

function capCongLenhMoiBoQuaTrung() {
  capVanBanMoiBoQuaTrung();
}

function hienKetQuaXuatThanhCong(res) {
  danhDauNhatKyCanLamMoi_();
  const ketqua = document.getElementById("ketqua");
  const data = res && res.data ? res.data : {};

  ketqua.style.display = "block";
  ketqua.innerHTML =
    "✅ " + (res.message || "Đã xử lý thành công.") +
    "<br><br><a class='link-btn' href='" + (data.linkFile || "#") + "' target='_blank'>📄 Mở file PDF</a>" +
    "<br><button class='share-btn' onclick=\"chiaSePdf('" + (data.linkFile || "") + "', '" + (data.tenFile || "Văn bản") + "')\">📲 Chia sẻ qua Zalo</button>";
}

/* ================= KIỂM TRA - HỦY - CẤP LẠI CŨ ================= */

function kiemTraCapLai() {
  const box = document.getElementById("lichSuCapLai");
  if (!box) return;

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

  if (!lyDo || !lyDo.trim()) {
    alert("Chưa nhập lý do hủy.");
    return;
  }

  const ghiChu = prompt("Ghi chú thêm nếu có:", "") || "";

  if (!confirm("Xác nhận hủy số " + soCu + " và cấp lại số mới?")) {
    return;
  }

  capLaiVanBan(loaiGiay, soCu, lyDo.trim(), ghiChu.trim());
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
    chucVu: layChucVuDayDu_(),
    phongKhu: document.getElementById("phongKhu").value,
    nguoiCap: document.getElementById("nguoiCap").value,
    ngayCapGiay: document.getElementById("ngayCapGiay").value
  };

  if (loaiGiay === "CONG_LENH") {
    params.diTu = document.getElementById("diTu").value.trim();
    params.den = layNoiDenCongLenh();
    params.noiDung = layNoiDungCongTac();
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

  const action = loaiGiay === "GIAY_GIOI_THIEU" ? "thuhoi_caplai_ggt" : "thuhoi_caplai_cl";

  goiApi(action, params, function(res) {
    if (!res || !res.ok) {
      ketqua.innerHTML = "❌ " + ((res && res.message) ? res.message : "Cấp lại thất bại.");
      return;
    }

    hienKetQuaXuatThanhCong(res);
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
  if (!e.target) return;

  if (e.target.id === "dongChi") {
    capNhatPhuongTienTheoTen_();
  }

  if (["dongChi", "tuoi", "noiDungGGT", "noiDungKhac", "ngayDi", "ngayVe", "ngayHetHan"].includes(e.target.id)) {
    anLichSuCapLai();
  }
});

document.addEventListener("change", function (e) {
  if (!e.target) return;

  if (e.target.id === "dongChi") {
    capNhatPhuongTienTheoTen_();
  }

  if (["loaiGiay", "phongKhu", "chucVu", "den", "noiDen", "noiDung", "phuongTien"].includes(e.target.id)) {
    anLichSuCapLai();
  }
});

/* ================= RESET - CHIA SẺ ================= */

function resetForm() {
  document.getElementById("dongChi").value = "";
  document.getElementById("tuoi").value = "";
  document.getElementById("chucVu").selectedIndex = 0;

  document.getElementById("diTu").value = "TTBTXH Tân Hiệp";
  document.getElementById("den").selectedIndex = 0;
  document.getElementById("denKhac").value = "";
  document.getElementById("denKhac").style.display = "none";
  document.getElementById("noiDung").value = "Nuôi bệnh";
  document.getElementById("noiDungKhac").value = "";
  document.getElementById("noiDungKhac").style.display = "none";
  NOI_DUNG_TU_DONG_THEO_TEN = "";
  NOI_DEN_TU_DONG_THEO_TEN = "";
  document.getElementById("ngayDi").value = "";
  document.getElementById("ngayVe").value = "";
  document.getElementById("phuongTien").selectedIndex = 0;
  document.getElementById("giayTo").value = "";

  document.getElementById("kinhGui").value = "";
  document.getElementById("noiDen").selectedIndex = 0;
  document.getElementById("noiDenKhac").value = "";
  document.getElementById("noiDenKhac").style.display = "none";
  document.getElementById("noiDungGGT").value = "";
  document.getElementById("ngayHetHan").value = "";

  document.getElementById("ngayCapGiay").value = "";
  document.getElementById("phongKhu").selectedIndex = 0;
  document.getElementById("nguoiCap").selectedIndex = 0;

  DU_LIEU_PHONG_KHU = null;
  PARAMS_CANH_BAO_PHONG_KHU = null;

  anLichSuCapLai();

  const inputTen = document.getElementById("dongChi");
  if (inputTen) inputTen.focus();
}

function chiaSePdf(link, tenFile) {
  if (!link) {
    alert("Không có link PDF để chia sẻ.");
    return;
  }

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

function taiBaoCao(options) {
  damBaoOCtimKiemNhatKy();
  const opts = options || {};
  const box = document.getElementById("baoCaoList");
  if (!box) return;

  // Hiển thị cache ngay lập tức nếu bộ nhớ hiện tại chưa có dữ liệu.
  if (!DU_LIEU_NHAT_KY.length) {
    napCacheNhatKy_();
  }

  if (DU_LIEU_NHAT_KY.length) {
    DU_LIEU_NHAT_KY_DANG_HIEN_THI = DU_LIEU_NHAT_KY;
    hienThiNhatKy(DU_LIEU_NHAT_KY_DANG_HIEN_THI);
  } else {
    box.innerHTML = "⏳ Đang tải Nhật ký lần đầu...";
  }

  if (DANG_TAI_NHAT_KY) return;

  if (opts.force || NHAT_KY_CAN_LAM_MOI || !DU_LIEU_NHAT_KY.length) {
    taiDuLieuNhatKyTuServer_();
    return;
  }

  // Chỉ hỏi backend một revision rất nhỏ; không tải toàn bộ Nhật ký nếu chưa đổi.
  DANG_TAI_NHAT_KY = true;
  goiApi("nhatky_revision", {}, function (res) {
    DANG_TAI_NHAT_KY = false;

    if (!res || !res.ok) {
      // Có cache thì tiếp tục cho người dùng xem; không thay bằng màn hình lỗi.
      if (!DU_LIEU_NHAT_KY.length) taiDuLieuNhatKyTuServer_();
      return;
    }

    const revisionMoi = String(res.revision || "");
    const cacheQuaCu = !NHAT_KY_CACHE_TIME || (Date.now() - NHAT_KY_CACHE_TIME > NHAT_KY_FORCE_REFRESH_MS);

    if (!NHAT_KY_REVISION_HIEN_TAI || revisionMoi !== NHAT_KY_REVISION_HIEN_TAI || cacheQuaCu) {
      taiDuLieuNhatKyTuServer_();
    }
  }, 15000);
}

function taiDuLieuNhatKyTuServer_() {
  if (DANG_TAI_NHAT_KY) return;
  DANG_TAI_NHAT_KY = true;

  const box = document.getElementById("baoCaoList");
  const coDuLieuCu = DU_LIEU_NHAT_KY.length > 0;
  if (!coDuLieuCu && box) box.innerHTML = "⏳ Đang đồng bộ Nhật ký...";

  goiApi("baocao", {}, function (res) {
    DANG_TAI_NHAT_KY = false;

    if (!res || !res.ok) {
      if (!coDuLieuCu && box) {
        const message = res && res.message ? res.message : "Không nhận được phản hồi từ hệ thống.";
        box.innerHTML = "❌ Không tải được Nhật ký.<br><small>" + escapeHtml(message) + "</small>";
      }
      return;
    }

    DU_LIEU_NHAT_KY = gopNhatKyTrungTen(res.data || []);
    DU_LIEU_NHAT_KY_DANG_HIEN_THI = DU_LIEU_NHAT_KY;
    NHAT_KY_REVISION_HIEN_TAI = String(res.revision || "");
    NHAT_KY_CACHE_TIME = Date.now();
    NHAT_KY_CAN_LAM_MOI = false;

    luuCacheNhatKy_();
    hienThiNhatKy(DU_LIEU_NHAT_KY_DANG_HIEN_THI);
  }, 60000);
}

function napCacheNhatKy_() {
  try {
    const raw = localStorage.getItem(NHAT_KY_CACHE_KEY);
    if (!raw) return false;
    const cache = JSON.parse(raw);
    if (!cache || !Array.isArray(cache.data)) return false;

    DU_LIEU_NHAT_KY = cache.data;
    DU_LIEU_NHAT_KY_DANG_HIEN_THI = cache.data;
    NHAT_KY_REVISION_HIEN_TAI = String(cache.revision || "");
    NHAT_KY_CACHE_TIME = Number(cache.savedAt) || 0;
    return true;
  } catch (e) {
    return false;
  }
}

function luuCacheNhatKy_() {
  try {
    localStorage.setItem(NHAT_KY_CACHE_KEY, JSON.stringify({
      revision: NHAT_KY_REVISION_HIEN_TAI,
      savedAt: NHAT_KY_CACHE_TIME || Date.now(),
      data: DU_LIEU_NHAT_KY
    }));
  } catch (e) {
    // Nếu trình duyệt hết dung lượng cache, hệ thống vẫn hoạt động bình thường bằng bộ nhớ phiên hiện tại.
    console.warn("Không lưu được cache Nhật ký", e);
  }
}

function danhDauNhatKyCanLamMoi_() {
  NHAT_KY_CAN_LAM_MOI = true;
  NHAT_KY_REVISION_HIEN_TAI = "";
}

function locNhatKy() {
  const keyword = document.getElementById("timKiemNhatKy").value.toLowerCase().trim();
  const tuNgay = document.getElementById("tuNgay").value;
  const denNgay = document.getElementById("denNgay").value;
  const loai = document.getElementById("locLoai").value;
  const trangThai = document.getElementById("locTrangThai").value;
  const phong = document.getElementById("locPhong").value;
  const nguoiCap = document.getElementById("locNguoiCap").value;

  const ketQua = DU_LIEU_NHAT_KY.map(function (itemPhong) {
    if (phong && itemPhong.phongKhu !== phong) return null;

    const nhanSuLoc = itemPhong.nhanSu.map(function (ns) {
      const danhSachLoc = ns.danhSach.filter(function (vb) {
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
          vb.trangThai,
          vb.lyDoHuy,
          vb.ghiChuHuy,
          vb.tenFile,
          vb.nguoiCap
        ].join(" ").toLowerCase();

        if (keyword && !text.includes(keyword)) return false;
        if (loai && vb.loaiGiay !== loai) return false;
        if (trangThai && chuanHoaTrangThai(vb.trangThai) !== chuanHoaTrangThai(trangThai)) return false;
        if (nguoiCap && chuanHoaTextTimKiem(vb.nguoiCap) !== chuanHoaTextTimKiem(nguoiCap)) return false;

        if (tuNgay && chuyenNgayLoc(vb.ngayCapGiay) < tuNgay) return false;
        if (denNgay && chuyenNgayLoc(vb.ngayCapGiay) > denNgay) return false;

        return true;
      });

      if (danhSachLoc.length === 0) return null;

      return {
        ...ns,
        danhSach: danhSachLoc,
        tongCL: danhSachLoc.filter(v => v.loaiGiay === "CONG_LENH").length,
        tongGGT: danhSachLoc.filter(v => v.loaiGiay === "GIAY_GIOI_THIEU").length
      };
    }).filter(Boolean);

    if (nhanSuLoc.length === 0) return null;

    return {
      ...itemPhong,
      nhanSu: nhanSuLoc,
      tongCL: nhanSuLoc.reduce((sum, ns) => sum + (ns.tongCL || 0), 0),
      tongGGT: nhanSuLoc.reduce((sum, ns) => sum + (ns.tongGGT || 0), 0)
    };
  }).filter(Boolean);

  DU_LIEU_NHAT_KY_DANG_HIEN_THI = ketQua;
  hienThiNhatKy(DU_LIEU_NHAT_KY_DANG_HIEN_THI);
}

function dinhDangNgayInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function apDungLocThoiGianNhanh() {
  const giaTri = document.getElementById("locThoiGianNhanh").value;
  const tuNgayEl = document.getElementById("tuNgay");
  const denNgayEl = document.getElementById("denNgay");

  if (!giaTri) {
    tuNgayEl.value = "";
    denNgayEl.value = "";
    locNhatKy();
    return;
  }

  const homNay = new Date();
  homNay.setHours(0, 0, 0, 0);
  let batDau = new Date(homNay);
  let ketThuc = new Date(homNay);

  if (giaTri === "THANG_NAY") {
    batDau = new Date(homNay.getFullYear(), homNay.getMonth(), 1);
    ketThuc = new Date(homNay.getFullYear(), homNay.getMonth() + 1, 0);
  } else if (giaTri === "QUY_NAY") {
    const thangBatDauQuy = Math.floor(homNay.getMonth() / 3) * 3;
    batDau = new Date(homNay.getFullYear(), thangBatDauQuy, 1);
    ketThuc = new Date(homNay.getFullYear(), thangBatDauQuy + 3, 0);
  }

  tuNgayEl.value = dinhDangNgayInput(batDau);
  denNgayEl.value = dinhDangNgayInput(ketThuc);
  locNhatKy();
}

function chuanHoaTextTimKiem(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}


function chuanHoaHoTenHienThi(value) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  if (!text) return "";

  return text
    .toLocaleLowerCase("vi-VN")
    .replace(/(^|[\s\-'])(\S)/g, function (_, dauCach, kyTu) {
      return dauCach + kyTu.toLocaleUpperCase("vi-VN");
    });
}

function chuanHoaInHoa(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("vi-VN");
}

/**
 * Gộp các nhóm có cùng họ tên nhưng khác kiểu viết hoa/thường hoặc khoảng trắng.
 * Ví dụ: "Nguyễn Thị Thùy Trang", "NGUYỄN THỊ THÙY TRANG" và
 * "nguyễn thị thùy trang" được xem là cùng một người.
 */
function gopNhatKyTrungTen(data) {
  const phongMap = new Map();

  (data || []).forEach(function (phong) {
    const tenPhong = String(phong.phongKhu || "Chưa phân loại").trim().replace(/\s+/g, " ");
    const khoaPhong = chuanHoaTextTimKiem(tenPhong);

    if (!phongMap.has(khoaPhong)) {
      phongMap.set(khoaPhong, {
        phongKhu: tenPhong,
        tongCL: 0,
        tongGGT: 0,
        nhanSuMap: new Map()
      });
    }

    const nhomPhong = phongMap.get(khoaPhong);

    (phong.nhanSu || []).forEach(function (ns) {
      const tenHienThi = chuanHoaHoTenHienThi(ns.dongChi || "Chưa rõ tên");
      const khoaTen = chuanHoaTextTimKiem(tenHienThi);

      if (!nhomPhong.nhanSuMap.has(khoaTen)) {
        nhomPhong.nhanSuMap.set(khoaTen, {
          dongChi: tenHienThi,
          tongCL: 0,
          tongGGT: 0,
          danhSach: []
        });
      }

      const nhanSu = nhomPhong.nhanSuMap.get(khoaTen);
      (ns.danhSach || []).forEach(function (vb) {
        const banGhi = {
          ...vb,
          dongChi: chuanHoaHoTenHienThi(vb.dongChi || tenHienThi),
          cotG: vb.loaiGiay === "GIAY_GIOI_THIEU" ? chuanHoaInHoa(vb.cotG) : vb.cotG
        };
        nhanSu.danhSach.push(banGhi);
      });
    });
  });

  return Array.from(phongMap.values()).map(function (phong) {
    const nhanSu = Array.from(phong.nhanSuMap.values()).map(function (ns) {
      ns.danhSach.sort(function (a, b) {
        const soA = Number(a.so);
        const soB = Number(b.so);
        if (!Number.isNaN(soA) && !Number.isNaN(soB) && soA !== soB) return soA - soB;
        return String(a.so || "").localeCompare(String(b.so || ""), "vi", { numeric: true });
      });
      ns.tongCL = ns.danhSach.filter(v => v.loaiGiay === "CONG_LENH").length;
      ns.tongGGT = ns.danhSach.filter(v => v.loaiGiay === "GIAY_GIOI_THIEU").length;
      return ns;
    });

    phong.tongCL = nhanSu.reduce((sum, ns) => sum + ns.tongCL, 0);
    phong.tongGGT = nhanSu.reduce((sum, ns) => sum + ns.tongGGT, 0);

    return {
      phongKhu: phong.phongKhu,
      tongCL: phong.tongCL,
      tongGGT: phong.tongGGT,
      nhanSu: nhanSu
    };
  });
}

function chuyenNgayLoc(value) {
  if (!value) return "";

  const s = String(value).trim();

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const parts = s.split("/");
    const d = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }

  return "";
}

function chuanHoaTrangThai(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/huỷ/g, "hủy");
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

  const tongCLLoc = data.reduce((tong, phong) => tong + Number(phong.tongCL || 0), 0);
  const tongGGTLoc = data.reduce((tong, phong) => tong + Number(phong.tongGGT || 0), 0);
  const nguoiCapDangLoc = document.getElementById("locNguoiCap")?.value || "";

  let html = `
    <div class="journal-filter-summary">
      <div><b>${tongCLLoc}</b><span>Công lệnh</span></div>
      <div><b>${tongGGTLoc}</b><span>Giấy giới thiệu</span></div>
      <div class="journal-filter-summary-wide"><b>${tongCLLoc + tongGGTLoc}</b><span>${nguoiCapDangLoc ? "Do " + escapeHtml(nguoiCapDangLoc) + " cấp" : "Tổng văn bản phù hợp"}</span></div>
    </div>`;

  data.forEach(function (phong, i) {
    const phongId = "phong_" + i;

    html += `
      <div class="report-group">
        <div class="report-title" onclick="toggleBox('${phongId}')">
          <div class="phong-left">
            <b>📁 ${escapeHtml(phong.phongKhu)}</b>
            <small>Nhấn để xem danh sách viên chức</small>
          </div>

          <div class="phong-right">
            <span>${phong.tongCL || 0} CL</span>
            <span>${phong.tongGGT || 0} GGT</span>
          </div>
        </div>

        <div id="${phongId}" class="report-body" style="display:none;">
    `;

    (phong.nhanSu || []).forEach(function (ns, j) {
      const nsId = "ns_" + i + "_" + j;

      html += `
        <div class="person-row" onclick="moNhanSuNhatKy('${nsId}', ${i}, ${j})">
          <div class="left">
            <b>👤 ${escapeHtml(ns.dongChi)}</b>
            <small>Nhấn để xem văn bản đã cấp</small>
          </div>

          <div class="right">
            <span>${ns.tongCL || 0} CL</span>
            <span>${ns.tongGGT || 0} GGT</span>
          </div>
        </div>

        <div id="${nsId}" class="person-detail" style="display:none;" data-rendered="0"></div>
      `;
    });

    html += `</div></div>`;
  });

  box.innerHTML = html;
}

function moNhanSuNhatKy(id, phongIndex, nhanSuIndex) {
  const el = document.getElementById(id);
  if (!el) return;

  if (el.dataset.rendered !== "1") {
    const phong = DU_LIEU_NHAT_KY_DANG_HIEN_THI[phongIndex];
    const ns = phong && phong.nhanSu ? phong.nhanSu[nhanSuIndex] : null;
    if (!ns) return;
    el.innerHTML = taoHtmlVanBanNhanSu_(ns, phongIndex, nhanSuIndex);
    el.dataset.rendered = "1";
  }

  el.style.display = el.style.display === "none" ? "block" : "none";
}

function taoHtmlVanBanNhanSu_(ns, i, j) {
  return (ns.danhSach || []).map(function (vb, k) {
    const vbId = "vb_" + i + "_" + j + "_" + k;
    const badge = vb.loaiGiay === "GIAY_GIOI_THIEU" ? "GGT" : "CL";
    const linkFile = vb.linkFile || "#";

    return `
      <div class="vb-mini-row" onclick="toggleBox('${vbId}')">
        <div>
          <b>${badge} ${escapeHtml(vb.so)}</b>
          <small>${escapeHtml(vb.noiDung || "")}</small>
        </div>
        <span>${escapeHtml(vb.cotJ || "")}</span>
      </div>

      <div id="${vbId}" class="cl-detail" style="display:none;">
        <p><b>Loại:</b> ${escapeHtml(vb.loaiTen || "")}</p>
        <p><b>Người được cấp:</b> ${escapeHtml(vb.dongChi || "")}</p>
        <p><b>Chức vụ:</b> ${escapeHtml(vb.chucVu || "")}</p>
        <p><b>${vb.loaiGiay === "GIAY_GIOI_THIEU" ? "Kính gửi" : "Đi từ"}:</b> ${escapeHtml(vb.cotG || "")}</p>
        <p><b>${vb.loaiGiay === "GIAY_GIOI_THIEU" ? "Nơi đến" : "Đến"}:</b> ${escapeHtml(vb.cotH || "")}</p>
        <p><b>Nội dung:</b> ${escapeHtml(vb.noiDung || "")}</p>
        <p><b>${vb.loaiGiay === "GIAY_GIOI_THIEU" ? "Ngày hết hạn" : "Ngày đi"}:</b> ${escapeHtml(vb.cotJ || "")}</p>
        ${vb.ngayVe ? `<p><b>Ngày về:</b> ${escapeHtml(vb.ngayVe)}</p>` : ""}
        ${vb.ngayCapGiay ? `<p><b>Ngày cấp trên giấy:</b> ${escapeHtml(vb.ngayCapGiay)}</p>` : ""}
        ${vb.phuongTien ? `<p><b>Phương tiện:</b> ${escapeHtml(vb.phuongTien)}</p>` : ""}
        ${vb.giayTo ? `<p><b>Giấy tờ:</b> ${escapeHtml(vb.giayTo)}</p>` : ""}
        ${vb.trangThai ? `<p><b>Trạng thái cấp:</b> ${escapeHtml(vb.trangThai)}</p>` : ""}
        ${vb.lyDoHuy ? `<p><b>Lý do hủy:</b> ${escapeHtml(vb.lyDoHuy)}</p>` : ""}
        ${vb.ghiChuHuy ? `<p><b>Ghi chú hủy:</b> ${escapeHtml(vb.ghiChuHuy)}</p>` : ""}
        ${vb.nguoiCap ? `<p><b>Người cấp:</b> ${escapeHtml(vb.nguoiCap)}</p>` : ""}

        <p><a href="${escapeHtml(linkFile)}" target="_blank" rel="noopener">📄 Mở PDF</a></p>

        <button class="danger-btn" onclick="huyVanBan('${vb.loaiGiay}', '${escapeHtml(vb.so)}')">
          🗑️ Hủy số này
        </button>
      </div>
    `;
  }).join("");
}

function toggleBox(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === "none" ? "block" : "none";
}

function huyVanBan(loaiGiay, so) {
  const tenLoai = loaiGiay === "GIAY_GIOI_THIEU" ? "giấy giới thiệu" : "công lệnh";

  const lyDoHuy = prompt("Nhập lý do hủy " + tenLoai + " số " + so + ":");

  if (!lyDoHuy || !lyDoHuy.trim()) {
    alert("Chưa nhập lý do hủy.");
    return;
  }

  const ghiChuHuy = prompt("Ghi chú thêm nếu có:", "") || "";

  if (!confirm("Xác nhận hủy " + tenLoai + " số " + so + " không?")) {
    return;
  }

  goiApi("huy", {
    loaiGiay: loaiGiay,
    so: so,
    lyDoHuy: lyDoHuy.trim(),
    ghiChuHuy: ghiChuHuy.trim()
  }, function (res) {
    if (!res || !res.ok) {
      alert("❌ " + ((res && res.message) ? res.message : "Không hủy được."));
      return;
    }

    alert("✅ " + res.message);
    danhDauNhatKyCanLamMoi_();
    taiDashboard();
    taiBaoCao({ force: true });
  });
}

function resetLoc() {
  document.getElementById("timKiemNhatKy").value = "";
  document.getElementById("tuNgay").value = "";
  document.getElementById("denNgay").value = "";
  document.getElementById("locThoiGianNhanh").selectedIndex = 0;
  document.getElementById("locLoai").selectedIndex = 0;
  document.getElementById("locTrangThai").selectedIndex = 0;
  document.getElementById("locPhong").selectedIndex = 0;
  document.getElementById("locNguoiCap").selectedIndex = 0;

  DU_LIEU_NHAT_KY_DANG_HIEN_THI = DU_LIEU_NHAT_KY;
  hienThiNhatKy(DU_LIEU_NHAT_KY_DANG_HIEN_THI);
}


/* ================= XEM TRƯỚC VÀ LƯU BÁO CÁO PDF ================= */

function layDieuKienBaoCao() {
  return {
    keyword: document.getElementById("timKiemNhatKy").value.trim(),
    tuNgay: document.getElementById("tuNgay").value,
    denNgay: document.getElementById("denNgay").value,
    loai: document.getElementById("locLoai").value,
    trangThai: "Đã cấp",
    phong: document.getElementById("locPhong").value,
    nguoiCap: document.getElementById("locNguoiCap").value
  };
}

function phangHoaDuLieuNhatKy(data) {
  const ds = [];
  (data || []).forEach(phong => {
    (phong.nhanSu || []).forEach(ns => {
      (ns.danhSach || []).forEach(vb => ds.push({ ...vb, phongKhu: vb.phongKhu || phong.phongKhu, dongChi: vb.dongChi || ns.dongChi }));
    });
  });
  return ds;
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function tenDieuKien(value, fallback) { return value ? escapeHtml(value) : fallback; }

function dinhDangNgayBoLoc(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return text;

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function xemTruocBaoCao() {
  const locTrangThaiEl = document.getElementById("locTrangThai");
  if (locTrangThaiEl && locTrangThaiEl.value !== "Đã cấp") {
    locTrangThaiEl.value = "Đã cấp";
    locNhatKy();
  }

  const ds = phangHoaDuLieuNhatKy(DU_LIEU_NHAT_KY_DANG_HIEN_THI)
    .filter(vb => chuanHoaTrangThai(vb.trangThai) === "đã cấp")
    .sort((a, b) => {
      const soA = Number(a.so);
      const soB = Number(b.so);
      if (Number.isFinite(soA) && Number.isFinite(soB) && soA !== soB) return soA - soB;
      if (a.loaiGiay !== b.loaiGiay) return String(a.loaiGiay).localeCompare(String(b.loaiGiay), "vi");
      return String(a.so).localeCompare(String(b.so), "vi", { numeric: true });
    });

  if (!ds.length) {
    alert("Không có văn bản đang ở trạng thái Đã cấp phù hợp để xem trước báo cáo.");
    return;
  }

  const dk = layDieuKienBaoCao();
  const tongCL = ds.filter(x => x.loaiGiay === "CONG_LENH").length;
  const tongGGT = ds.filter(x => x.loaiGiay === "GIAY_GIOI_THIEU").length;

  const rows = ds.map((vb, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(vb.loaiGiay === "GIAY_GIOI_THIEU" ? "GGT" : "CL")}</td>
      <td>${escapeHtml(vb.so)}</td>
      <td>${escapeHtml(vb.dongChi)}</td>
      <td>${escapeHtml(vb.noiDung)}</td>
      <td>${escapeHtml(vb.ngayCapGiay)}</td>
      <td>${escapeHtml(vb.phongKhu)}</td>
      <td>${escapeHtml(vb.nguoiCap || "Chưa cập nhật")}</td>
    </tr>`).join("");

  document.getElementById("noiDungXemTruoc").innerHTML = `
    <div class="report-paper">
      <div class="report-agency">TRUNG TÂM BẢO TRỢ XÃ HỘI TÂN HIỆP</div>
      <h2>BÁO CÁO NHẬT KÝ CẤP VĂN BẢN</h2>
      <div class="report-filter-summary">
        <span><b>Từ ngày:</b> ${tenDieuKien(dinhDangNgayBoLoc(dk.tuNgay), "Tất cả")}</span>
        <span><b>Đến ngày:</b> ${tenDieuKien(dinhDangNgayBoLoc(dk.denNgay), "Tất cả")}</span>
        <span><b>Loại:</b> ${tenDieuKien(dk.loai === "CONG_LENH" ? "Công lệnh" : dk.loai === "GIAY_GIOI_THIEU" ? "Giấy giới thiệu" : "", "Tất cả")}</span>
        <span><b>Trạng thái:</b> Chỉ văn bản đã cấp</span>
        <span><b>Phòng/Khu:</b> ${tenDieuKien(dk.phong, "Tất cả")}</span>
        <span><b>Người cấp:</b> ${tenDieuKien(dk.nguoiCap, "Tất cả")}</span>
      </div>
      <div class="report-stats report-stats-three">
        <div><b>${tongCL}</b><span>Công lệnh</span></div>
        <div><b>${tongGGT}</b><span>Giấy giới thiệu</span></div>
        <div><b>${ds.length}</b><span>Tổng đã cấp</span></div>
      </div>
      <div class="report-table-wrap"><table class="report-preview-table">
        <thead><tr><th>STT</th><th>Loại</th><th>Số</th><th>Người được cấp</th><th>Nội dung</th><th>Ngày cấp</th><th>Phòng/Khu</th><th>Người cấp</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;

  const modal = document.getElementById("modalBaoCao");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  taiDanhSachBaoCaoPdf();
}

function dongXemTruocBaoCao() {
  const modal = document.getElementById("modalBaoCao");
  if (!modal) return;
  modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function taoRequestIdBaoCao() {
  return "BC-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

function xuatBaoCaoPdf() {
  const ds = phangHoaDuLieuNhatKy(DU_LIEU_NHAT_KY_DANG_HIEN_THI);
  if (!ds.length) { alert("Không có dữ liệu để tạo PDF."); return; }
  const btn = document.getElementById("btnXuatBaoCaoPdf");
  btn.disabled = true; btn.textContent = "⏳ Đang tạo PDF...";
  goiApi("xuat_baocao_pdf", { ...layDieuKienBaoCao(), requestId: taoRequestIdBaoCao() }, function(res) {
    btn.disabled = false; btn.textContent = "📄 Tạo và mở PDF";
    if (!res || !res.ok) { alert("❌ " + ((res && res.message) || "Không tạo được báo cáo PDF.")); return; }
    taiDanhSachBaoCaoPdf();
    if (res.data && res.data.linkFile) window.open(res.data.linkFile, "_blank", "noopener");
    else alert("Đã tạo báo cáo nhưng chưa nhận được đường dẫn mở file.");
  });
}

function taiDanhSachBaoCaoPdf() {
  const box = document.getElementById("danhSachBaoCaoDaLuu");
  if (!box) return;
  box.innerHTML = "⏳ Đang tải...";
  goiApi("danh_sach_bao_cao_pdf", {}, function(res) {
    if (!res || !res.ok) { box.innerHTML = "Không tải được danh sách báo cáo đã lưu."; return; }
    const ds = (res.data || []);
    if (!ds.length) { box.innerHTML = "Chưa có báo cáo PDF nào được lưu."; return; }
    box.innerHTML = ds.map(x => `
      <a class="saved-report-item" href="${escapeHtml(x.linkFile || "#")}" target="_blank" rel="noopener">
        <div><b>${escapeHtml(x.tenFile)}</b><small>${escapeHtml(x.thoiGianTao)} · ${escapeHtml(x.tongSo)} văn bản</small></div><span> Mở ↗</span>
      </a>`).join("");
  });
}

document.addEventListener("keydown", function(e) { if (e.key === "Escape") dongXemTruocBaoCao(); });

function damBaoOCtimKiemNhatKy() {
  return;
}


/* ================= PWA ================= */

function dangKyServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js?v=" + CURRENT_VERSION)
      .then(reg => reg.update())
      .catch(err => console.log("Không đăng ký được service worker", err));
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

/* ================= KHỞI ĐỘNG ================= */

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
