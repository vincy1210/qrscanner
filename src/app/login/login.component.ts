import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  VERSION,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  FormControl,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from 'src/service/common.service';
import { MenuItem } from 'primeng/api';

import { MessageService } from 'primeng/api';
import { ZXingScannerComponent } from '@zxing/ngx-scanner';
import { Result } from '@zxing/library';
import { BarcodeFormat } from '@zxing/library';
import { ApiService } from 'src/service/api.service';
import { AuthService } from 'src/service/auth.service';
import { ConstantsService } from 'src/service/constants.service';
import { TranslateService } from '@ngx-translate/core';
import { QRCodeType } from '../shared/models/filetype-model';
import { catchError, throwError } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [MessageService],
})
export class LoginComponent {
  items: MenuItem[];
  activeIndex: number = 0;
  edasreqno = '';
  desiredDevice: any;
  torch = false;
  scannerEnabled = true;
  allowedFormats = [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.CODE_128,
    BarcodeFormat.DATA_MATRIX,
  ];
  uuid: string = '1222';
  isSearchResult: boolean = false;
  searchResults: QRCodeType[] = [];
  isMaximized: boolean = false;
  IsFileFound: boolean = false;
  src: string = '';
  fileContentEncode: any;
  isLoading: boolean = false;
  showLockScreen: boolean = true;
  allowScanning = true;
  isScanned: boolean = false;

  constructor(
    private router: Router,
    private apiservice: ApiService,
    public common: CommonService,
    private consts: ConstantsService,
    private auth: AuthService,
    private translate: TranslateService
  ) {
    sessionStorage.setItem(
      'token',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VyQ2xhaW0iOiJBZG1pbiIsIm5iZiI6MTcwNjYxMDQ4NCwiZXhwIjoxNzA2NjIyNDg0LCJpYXQiOjE3MDY2MTA0ODR9.MyUGYHH7mp8MXk8o3kESZkB1uP221CJhd8asQH1cIq8'
    );
    this.items = [
      { label: 'Step1' },
      { label: 'Step2' },
      { label: 'Step3' },
      { label: 'Step4' },
    ];
  }
  indexchange(event: any) {
    // console.log(event);
  }
  scanNow() {
    // Add your scan logic here
    console.log('Scanning now...');
  }

  goToPrevstep(number: number) {
    this.activeIndex = number;
    this.clear(false);
  }

  clear(isScanned: boolean = false) {
    this.edasreqno = '';
    this.isScanned = isScanned;
    this.isSearchResult = false;
  }

  goToNextstep(number: number) {
    // this.activeIndex = 1;
    if (this.activeIndex == 1) {
      this.activeIndex += 1;
    } else {
      this.activeIndex = number; // this.activeIndex + 1;
    }
    if (this.activeIndex > 3) {
      this.activeIndex = 3;
    }
  }

  ngOnInit(): void {
    if (!this.common.isMobile() && !this.common.isTablet()) {
      // this.common.showSweetAlert('Warning', 'Open in mobile device');
      this.showLockScreen = true;
    } else {
      this.showLockScreen = false;
    }
  }

  scanSuccessHandler(event: any) {
    // console.log(event);
    if (this.allowScanning) {
      this.isScanned = true;
      this.edasreqno = event;
      const inValidList: string[] = this.isValidCriterias(this.edasreqno);
      if (inValidList && inValidList.length > 0) {
        this.clear(true);
        const inValidMsg: string = inValidList.at(0) || '';
        // this.common.showErrorMessage(inValidMsg)
      } else {
        this.getDocDataForQRcode();
        //
        this.allowScanning = false;
        setTimeout(() => {
          this.allowScanning = true;
        }, 4000);
      }
    }
  }

  scanErrorHandler(event: any) {
    // console.log(event);
  }

  scanFailureHandler(event: any) {
    // console.log(event);
  }

  scanCompleteHandler(event: any) {
    // console.log(event);
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    // console.log(devices);
    if (devices && devices.length > 0) {
      // Cameras found, enable scanning
      this.scannerEnabled = true;
    } else {
      // No cameras found, disable scanning
      this.scannerEnabled = false;
    }
  }

  isValidCriterias(edasreqno: string): string[] {
    const inValidList: string[] = [];
    const startList: string[] = ['AECI', 'COO', 'LCC'];
    if (edasreqno.length > 25) {
      inValidList.push('Size exceeds');
    }
    if (edasreqno.length > 5) {
      const searchString = edasreqno.substring(0, 3);
      const isInclude: boolean = startList.some((item) =>
        item.includes(searchString)
      );
      if (!isInclude) {
        inValidList.push('Not valid request');
      }
    }
    if (edasreqno.length <= 5) {
      inValidList.push('Too short');
    }
    return inValidList;
  }

  getDocDataForQRcode() {
    this.isSearchResult = false;
    let resp;
    let data = {
      uuid: this.uuid,
      edasreqno: this.edasreqno,
    };
    this.common.showLoading();
    this.apiservice.post(this.consts.getDocDataForQRcode, data).subscribe({
      next: (success: any) => {
        this.common.hideLoading();
        resp = success;
        if (`${resp.responsecode}` == '1') {
          this.searchResults = resp.data;
          if (this.searchResults && this.searchResults.length > 0) {
            this.searchResults.map((item) => {
              item.docissuedate = moment(item.docissuedate).format(
                'DD-MMM-YYYY'
              );
              item.docexpirydate = moment(item.docexpirydate).format(
                'DD-MMM-YYYY'
              );
              //
              item.viewmoredatas = [];
              item.viewmoredatas.push({
                label: 'REQUEST NUMBER',
                value: item.edasreqno,
              });
              // item.viewmoredatas.push({
              //   label: 'DOCUMENT NAME',
              //   value: item.docname,
              // });
              item.viewmoredatas.push({
                label: 'ISSUE DATE',
                value: item.docissuedate,
              });
              item.viewmoredatas.push({
                label: 'EXPIRY DATE',
                value: item.docexpirydate,
              });
              item.viewmoredatas.push({
                label: 'ENTITY NAME',
                value: item.entityname,
              });
              item.viewmoredatas.push({
                label: 'STATUS',
                value: item.docstatus,
              });
            });
            const firstrecord: QRCodeType =
              this.searchResults.at(0) || ({} as QRCodeType);
            if (firstrecord?.docstatus === 'Valid') {
              this.isSearchResult = true;
            } else {
              this.isSearchResult = false;
            }
          }
          this.validateSteps();
        } else {
          this.clear(true);
          // this.common.showWarningMessage(
          //   this.translate.instant('Not valid QR Code')
          // );
          // this.loading = false;
        }
      },
      error: (error: any) => {
        console.error('Error:', error);
        this.common.showErrorMessage(error.error.data);
        this.common.hideLoading();
      },
    });
  }

  validateSteps() {
    if (this.edasreqno && this.isSearchResult) {
      if (this.activeIndex === 1) {
        // this.activeIndex += 1;
        // this.common.showSuccessMessage('Record validated');
      }
    } else {
      // this.common.showWarningMessage('Record not exists');
    }
  }

  getFileDetForQRCode(param: any) {
    let resp,
      entityname = '';
    if (this.searchResults && this.searchResults.length > 0) {
      entityname = this.searchResults[0]?.entityname;
    }
    let data = {
      uuid: this.uuid,
      edasreqno: param.edasreqno,
      entityname: entityname,
    };
    this.common.showLoading();
    this.apiservice.post(this.consts.getFileDetForQRCode, data).subscribe({
      next: (success: any) => {
        this.common.hideLoading();
        resp = success;
        if (`${resp.responsecode}` == '1') {
          const fileDetails: any[] = resp.data;
          if (fileDetails && fileDetails.length > 0) {
            const firstrecord: { edasreqno: string; filepath: string } =
              fileDetails.at(0) || ({} as any);
            if (firstrecord?.filepath) {
              this.fileContentEncode = firstrecord?.filepath;
              this.downloadFileContent(true);
            } else {
              this.common.showWarningMessage('No file found');
            }
          }
          // this.validateSteps();
        } else {
          this.common.showWarningMessage(this.translate.instant('Not valid'));
          // this.loading = false;
        }
      },
      error: (error: any) => {
        console.error('Error:', error);
        this.common.showErrorMessage(error.error.data);
        this.common.hideLoading();
      },
    });
  }

  downloadFileContent(fromHtml: boolean) {
    this.IsFileFound = true;
    const data = {
      attestfilelocation: this.fileContentEncode,
      uuid: this.uuid,
    };
    this.apiservice
      .post(this.consts.getAttestationFileContent, data)
      .pipe(
        catchError((error) => {
          // this.common.showErrorMessage(error?.message);
          // this.loading = false;
          this.common.hideLoading();
          return throwError(error);
        })
      )
      .subscribe((response: any) => {
        const dictionary = response;
        if (`${dictionary.responsecode}` === '1') {
          if (fromHtml) {
            this.common.downloadFile(dictionary?.data, 'preview-file.pdf');
          } else {
            this.src = `data:application/pdf;base64,${dictionary?.data}`;
          }
          if (!dictionary?.data) {
            this.IsFileFound = false;
          }
        } else {
          this.IsFileFound = false;
          this.common.showErrorMessage(this.translate.instant('label.error'));
        }
      });
  }

  maximizeFile() {
    this.isMaximized = !this.isMaximized;
  }
}
