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
    if (!res || !res.ok || !res.data) return;

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