import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import WebViewer, { WebViewerInstance } from '@pdftron/webviewer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('viewer', { static: false }) viewer?: ElementRef;

  title = 'sample';

  private viewerInstance: WebViewerInstance;

  ngAfterViewInit(): void {
    WebViewer(
      {
        path: '/webviewer',
        initialDoc:
          'https://stscc001.blob.core.windows.net/test-public/133.PDF',
        licenseKey: 'your_license_key', // sign up to get a free trial key at https://dev.apryse.com
      },
      this.viewer!.nativeElement
    ).then((instance: WebViewerInstance) => {
      this.viewerInstance = instance;

      this.addMenuDownloadButton();

      this.createWartermark('aaaaaaaaaaaaaaaa');
    });
  }

  private addMenuDownloadButton() {
    this.viewerInstance.UI.settingsMenuOverlay.add(
      [
        {
          type: 'actionButton',
          className: 'row',
          label: 'Downloadddddddddd',
          onClick: () => {
            this.viewerInstance.UI.downloadPdf({
              filename: 'test.pdf',
              includeAnnotations: true,
              flatten: true,
              flags: this.viewerInstance.Core.SaveOptions.LINEARIZED,
            });

            return;
          },
        },
      ],
      'downloadButton'
    );
  }

  /**
   * ウォーターマーク表示
   * @param {string | null} watermarkString ウォーターマーク文字列
   */
  protected createWartermark(watermarkString: string | null): void {
    // ウォーターマーク文字列が設定されていない場合は表示しない。
    if (watermarkString == null) return;

    // ページ毎に以下のコールバック関数が呼ばれる。
    this.viewerInstance.Core.documentViewer.setWatermark({
      shouldDrawOverAnnotations: true,
      custom: (ctx, pageNumber, pageWidth, pageHeight) => {
        // 長さ調整したウォーターマーク文字列を取得
        const adujstWatermarkString = this.getWatermarkAdjustLength(
          watermarkString,
          ctx,
          pageWidth,
          pageHeight
        );

        ctx.font = '20pt Arial';

        ctx.textAlign = 'left';

        ctx.textBaseline = 'top';

        // 渡されたウォーターマーク文字列のTextMetricsを取得
        const measure = ctx.measureText(adujstWatermarkString);

        // ウォーターマーク文字列の高さを取得 (基準点から上枠、下枠までの距離を足す)
        const height =
          Math.abs(measure.actualBoundingBoxAscent) +
          Math.abs(measure.actualBoundingBoxDescent);

        const heightOffset = 20;

        let heightPosition = heightOffset;

        // 原稿の一番上から順にウォーターマーク文字を描画するループ
        while (heightPosition <= pageHeight - (height + heightOffset)) {
          // ウォーターマーク描画
          this.drawWatermark(ctx, 0, heightPosition, adujstWatermarkString);

          // 次のウォーターマーク描画開始縦位置を求める
          heightPosition = heightPosition + (heightOffset + height);
        }

        // ウォーターマーク文字列横位置間のオフセット
        const widthOffset = 30;

        // ウォーターマーク文字列の描画開始横位置
        // ★point : 縦位置の描画で余っている分を考慮した横位置にする。
        let widthPosition = heightPosition - pageHeight;

        while (widthPosition <= pageWidth - (height + widthOffset)) {
          // ウォーターマーク描画
          this.drawWatermark(
            ctx,
            widthPosition,
            pageHeight,
            adujstWatermarkString
          );

          // 次のウォーターマーク描画開始横位置を求める
          widthPosition = widthPosition + (widthOffset + height);
        }
      },
    });
  }

  /**
   * ウォーターマーク文字列を描画します。
   * @param {CanvasRenderingContext2D} ctx canvas
   * @param widthPosition ウォーターマーク文字描画開始横位置
   * @param heightPosition ウォーターマーク文字描画開始縦位置
   * @param watermarkString ウォーターマーク文字
   */
  private drawWatermark(
    ctx: CanvasRenderingContext2D,
    widthPosition: number,
    heightPosition: number,
    watermarkString: string
  ): void {
    ctx.fillStyle = '#FF0000';

    ctx.globalAlpha = 0.5;

    ctx.save();

    ctx.translate(widthPosition, heightPosition);

    ctx.rotate((-40 * Math.PI) / 180);

    ctx.fillText(watermarkString, 0, 0);

    ctx.restore();
  }

  /**
   * 対角線の長さを取得
   * @param {number} pageWidth ページ横幅
   * @param {number} pageHeight ページ縦幅
   * @returns {number} 対角線の長さ
   */
  private getDiagonal(pageWidth: number, pageHeight: number): number {
    if (pageWidth <= 0 || pageHeight <= 0) return 0;

    return Math.sqrt(Math.pow(pageWidth, 2) + Math.pow(pageHeight, 2));
  }

  /**
   * 対角線より長いウォーターマーク文字列を作成します。
   * @param {string} watermarkString ウォーターマーク文字列
   * @param {CanvasRenderingContext2D} ctx canvas
   * @param {number} pageWidth ページ横幅
   * @param {number} pageHeight ページ縦幅
   * @returns {string} 対角線より長いウォーターマーク文字列
   */
  private getWatermarkAdjustLength(
    watermarkString: string,
    ctx: CanvasRenderingContext2D,
    pageWidth: number,
    pageHeight: number
  ): string {
    let adjustString = watermarkString;

    const diagonal = this.getDiagonal(pageWidth, pageHeight);

    let measure = ctx.measureText(watermarkString);

    // 対角線より長くなるまでループ
    while (measure.width < diagonal) {
      // ウォーターマーク文字列を追加する
      adjustString = adjustString + ' ' + watermarkString;

      // 長くしたウォーターマーク文字列のTextMetricsを取得
      measure = ctx.measureText(adjustString);
    }

    return adjustString;
  }
}
