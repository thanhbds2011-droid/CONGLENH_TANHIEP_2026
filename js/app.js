function capCongLenh() {
  const ketqua = document.getElementById("ketqua");

  const params = {
    dongChi: document.getElementById("dongChi").value,
    tuoi: document.getElementById("tuoi").value,
    chucVu: document.getElementById("chucVu").value,
    diTu: document.getElementById("diTu").value,
    den: document.getElementById("den").value,
    noiDung: document.getElementById("noiDung").value,
    ngayDi: document.getElementById("ngayDi").value,
    ngayVe: document.getElementById("ngayVe").value,
    phuongTien: document.getElementById("phuongTien").value,
    giayTo: document.getElementById("giayTo").value,
    phongKhu: document.getElementById("phongKhu").value
  };

  ketqua.style.display = "block";
  ketqua.innerHTML = "⏳ Đang xuất công lệnh PDF...";

  goiApi("xuat", params, function(res) {
    if (!res.ok) {
      ketqua.innerHTML = "❌ " + res.message;
      return;
    }

    ketqua.innerHTML =
      "✅ " + res.message +
      "<br><br><a href='" + res.data.linkFile + "' target='_blank'>📄 Mở file PDF</a>" +
      "<br><br><button class='print-btn' onclick=\"inCongLenh('" + res.data.fileId + "')\">🖨️ In công lệnh</button>";

    taiDashboard();
  });
}
function inCongLenh(fileId) {
  const ketqua = document.getElementById("ketqua");

  ketqua.innerHTML += "<br><br>⏳ Đang gửi lệnh in...";

  goiApi("in", { fileId: fileId }, function(res) {
    if (!res.ok) {
      ketqua.innerHTML += "<br>❌ " + res.message;
      return;
    }

    ketqua.innerHTML += "<br>🖨️ " + res.message;
  });
}
