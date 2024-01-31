﻿import { Component } from '@angular/core';

@Component({
  moduleId: module.id,
  styles: [
    `
      .pageNotFound-window {
        min-height: 100vh;
        padding: 1rem;
      }
    `,
  ],
  template: `
    <div class="main-panel pageNotFound-window">
      <div
        class="content-wrapper d-flex align-items-center text-center error-page pt-5"
      >
        <div class="row flex-grow">
          <div class="col-lg-7 mx-auto">
            <div class="row align-items-center d-flex flex-row">
              <div class="col-lg-6 text-lg-right pr-lg-4">
                <h1 class="display-1 mb-0">404</h1>
              </div>
              <div class="col-lg-6 error-page-divider text-lg-left pl-lg-4">
                <h2>SORRY!</h2>
                <h3 class="font-weight-light">
                  The page you’re looking for was not found.
                </h3>
              </div>
            </div>
            <div class="row mt-5">
              <div class="col-12 text-center mt-xl-2">
                <a class="font-weight-medium" routerLink="/">Back to home</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PageNotFoundComponent {
  constructor() {}
}
