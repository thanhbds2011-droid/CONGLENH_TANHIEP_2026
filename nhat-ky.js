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