# PWAアイコン生成（Node/Python不要、.NET System.Drawing のみ使用）
# 使い方: powershell -ExecutionPolicy Bypass -File generate-icons.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$accent = [System.Drawing.Color]::FromArgb(255, 0xE3, 0xA2, 0x72)
$accentStrong = [System.Drawing.Color]::FromArgb(255, 0x7A, 0x4A, 0x25)

function New-Icon([int]$size, [string]$path, [bool]$square) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  $bgBrush = New-Object System.Drawing.SolidBrush($accent)
  if ($square) {
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)
  } else {
    $radius = [int]($size * 0.22)
    $path2 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path2.AddArc(0, 0, $d, $d, 180, 90)
    $path2.AddArc($size - $d, 0, $d, $d, 270, 90)
    $path2.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
    $path2.AddArc(0, $size - $d, $d, $d, 90, 90)
    $path2.CloseFigure()
    $g.FillPath($bgBrush, $path2)
  }

  # 中央に星形（欲しい/やりたいの「憧れ」を表すシンプルな図形）
  $starBrush = New-Object System.Drawing.SolidBrush($accentStrong)
  $cx = $size / 2.0
  $cy = $size / 2.0
  $outerR = $size * 0.30
  $innerR = $size * 0.13
  $points = New-Object System.Collections.Generic.List[System.Drawing.PointF]
  for ($i = 0; $i -lt 10; $i++) {
    $r = if ($i % 2 -eq 0) { $outerR } else { $innerR }
    $angle = (-90 + $i * 36) * [Math]::PI / 180
    $x = $cx + $r * [Math]::Cos($angle)
    $y = $cy + $r * [Math]::Sin($angle)
    $points.Add((New-Object System.Drawing.PointF($x, $y)))
  }
  $g.FillPolygon($starBrush, $points.ToArray())

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

New-Icon -size 192 -path (Join-Path $root "icon-192.png") -square $false
New-Icon -size 512 -path (Join-Path $root "icon-512.png") -square $false
New-Icon -size 180 -path (Join-Path $root "icon-180.png") -square $true
New-Icon -size 32  -path (Join-Path $root "favicon-32.png") -square $false

Write-Host "Icons generated in $root"
