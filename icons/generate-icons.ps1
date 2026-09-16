# PWAアイコン生成（Node/Python不要、.NET System.Drawing のみ使用）
# 使い方: powershell -ExecutionPolicy Bypass -File generate-icons.ps1
# 読書記録・思考メモ・ほしい/やりたい・就活選考管理の4つで
# 角丸の形・余白・記号の太さを揃え、色と中の記号だけ変えている。
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function P([single]$x, [single]$y) { New-Object System.Drawing.PointF($x, $y) }

function RoundRect($x, $y, $w, $h, $r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

$bg = [System.Drawing.Color]::FromArgb(255, 0xE3, 0xA2, 0x72)
$fg = [System.Drawing.Color]::FromArgb(255, 0xFF, 0xFF, 0xFF)

function Draw-Symbol($g, $size, $brush, $bgBrush) {
  # 星（欲しい・やりたいの「憧れ」）。元の絵柄を引き継ぎ、白にして小さくても見えるようにした
  $cx = $size / 2.0
  $cy = $size * 0.505
  $outerR = $size * 0.30
  $innerR = $size * 0.132
  $pts = New-Object System.Collections.Generic.List[System.Drawing.PointF]
  for ($i = 0; $i -lt 10; $i++) {
    $r = if ($i % 2 -eq 0) { $outerR } else { $innerR }
    $angle = (-90 + $i * 36) * [Math]::PI / 180
    $pts.Add((P ($cx + $r * [Math]::Cos($angle)) ($cy + $r * [Math]::Sin($angle))))
  }
  $g.FillPolygon($brush, $pts.ToArray())
}

function New-Icon([int]$size, [string]$path, [bool]$square) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  $bgBrush = New-Object System.Drawing.SolidBrush($bg)
  if ($square) {
    # iOSのホーム画面は自分で角を丸めるので、apple-touch-icon用は四角のまま
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)
  } else {
    $g.FillPath($bgBrush, (RoundRect 0 0 $size $size ([int]($size * 0.22))))
  }

  $fgBrush = New-Object System.Drawing.SolidBrush($fg)
  Draw-Symbol $g ([single]$size) $fgBrush $bgBrush

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

New-Icon -size 192 -path (Join-Path $root "icon-192.png") -square $false
New-Icon -size 512 -path (Join-Path $root "icon-512.png") -square $false
New-Icon -size 180 -path (Join-Path $root "icon-180.png") -square $true
New-Icon -size 32  -path (Join-Path $root "favicon-32.png") -square $false

Write-Host "Icons generated in $root"
