const API_URL = "https://script.google.com/macros/s/AKfycbzsBlbmfyzecmKurNXbyz4oFCEvV9y472P4xbiba-gvE9a3yOSmzNHvF_aSe0HEMrt0/exec";
const API_TOKEN = "CONGLENH_TANHIEP_2026";
const CURRENT_VERSION = "106";

let DU_LIEU_NHAT_KY = [];

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
      ganText("soTiepTheoCL", "Lỗi");
      ganText("tongCL", "Lỗi");
      ganText("huyCL", "Lỗi");
      ganText("soTiepTheoGGT", "Lỗi");
      ganText("tongGGT", "Lỗi");
      ganText("huyGGT", "Lỗi");
      return;
    }

    ganText("soTiepTheoCL", res.data.soTiepTheoCL ?? "-");
    ganText("tongCL", res.data.tongCL ?? 0);
    ganText("huyCL", res.data.huyCL ?? 0);

    ganText("soTiepTheoGGT", res.data.soTiepTheoGGT ?? "-");
    ganText("tongGGT", res.data.tongGGT ?? 0);
    ganText("huyGGT", res.data.huyGGT ?? 0);
  });
}

function ganText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
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

    DU_LIEU_NHAT_KY = res.data || [];
    hienThiNhatKy(DU_LIEU_NHAT_KY);
  });
}

function locNhatKy() {
  const input = document.getElementById("timKiemNhatKy");
  const keyword = input ? input.value.toLowerCase().trim() : "";

  if (!keyword) {
    hienThiNhatKy(DU_LIEU_NHAT_KY);
    return;
  }

  const ketQua = DU_LIEU_NHAT_KY.map(function (phong) {
    const nhanSuLoc = phong.nhanSu.map(function (ns) {
      const danhSachLoc = ns.danhSach.filter(function (vb) {
        const text = [
          phong.phongKhu,
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

        return text.includes(keyword);
      });

      const matchTen = ns.dongChi.toLowerCase().includes(keyword);
      const matchPhong = phong.phongKhu.toLowerCase().includes(keyword);

      if (matchTen || matchPhong) {
        return ns;
      }

      if (danhSachLoc.length > 0) {
        return {
          ...ns,
          danhSach: danhSachLoc,
          tongCL: danhSachLoc.filter(v => v.loaiGiay === "CONG_LENH").length,
          tongGGT: danhSachLoc.filter(v => v.loaiGiay === "GIAY_GIOI_THIEU").length
        };
      }

      return null;
    }).filter(Boolean);

    if (nhanSuLoc.length === 0) return null;

    return {
      ...phong,
      nhanSu: nhanSuLoc,
      tongCL: nhanSuLoc.reduce((sum, ns) => sum + (ns.tongCL || 0), 0),
      tongGGT: nhanSuLoc.reduce((sum, ns) => sum + (ns.tongGGT || 0), 0)
    };
  }).filter(Boolean);

  hienThiNhatKy(ketQua);
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
        <div class="report-title cap-phong" onclick="toggleBox('${phongId}')">
          <div>
            <b>📁 ${phong.phongKhu}</b>
            <small>Nhấn để xem danh sách viên chức</small>
          </div>
          <div class="count-box">
            <span>${phong.tongCL || 0} CL</span>
            <span>${phong.tongGGT || 0} GGT</span>
          </div>
        </div>

        <div id="${phongId}" class="report-body" style="display:none;">
    `;

    phong.nhanSu.forEach(function (ns, j) {
      const nsId = "ns_" + i + "_" + j;

      html += `
        <div class="person-row cap-nguoi" onclick="toggleBox('${nsId}')">
          <div>
            <b>👤 ${ns.dongChi}</b>
            <small>Nhấn để xem văn bản đã cấp</small>
          </div>
          <div class="count-box small-count">
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
          <div class="vb-mini-row cap-vanban" onclick="toggleBox('${vbId}')">
            <div>
              <b>${badge} ${vb.so}</b>
              <small>${vb.noiDung || ""}</small>
            </div>
            <span>${vb.cotJ || ""}</span>
          </div>

          <div id="${vbId}" class="cl-detail mini-detail" style="display:none;">
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

function kiemTraCapNhat() {
  fetch("version.json?v=" + Date.now())
    .then(res => res.json())
    .then(data => {
      if (data.version && data.version !== CURRENT_VERSION) {
        hienThongBaoCapNhat(data.message || "Có phiên bản mới.");
      }
    })
    .catch(() => {});
}

function hienThongBaoCapNhat(message) {
  if (document.getElementById("updateBox")) return;

  const box = document.createElement("div");
  box.id = "updateBox";
  box.innerHTML = `
    <div class="update-box">
      🔄 ${message}
      <br><br>
      <button onclick="location.reload()">Cập nhật ngay</button>
    </div>
  `;
  document.body.appendChild(box);
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
window.addEventListener("load", function () {
  doiLoaiGiay();
  damBaoOCtimKiemNhatKy();
  taiDashboard();

  setInterval(taiDashboard, 10000);
  setInterval(kiemTraCapNhat, 30000);
});

