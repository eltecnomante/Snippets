import {Component, Input} from '@angular/core';

@Component({
    selector: 'my-app',
    //templateUrl: 'app/templates/initial.html'
    template: '<div>{{user}}</div>'
})

export class AppComponent {
    @Input() user;
  exportData(){
    console.log('test angular2')
  }
 }
