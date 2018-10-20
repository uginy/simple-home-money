import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { LoaderComponent } from './components/loader/loader.component';

@NgModule({
  declarations: [LoaderComponent],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgxChartsModule,
  ],
  exports: [
    ReactiveFormsModule,
    FormsModule,
    NgxChartsModule,
    LoaderComponent
  ]
})
export class SharedModule {}
