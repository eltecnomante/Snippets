import {Component, Input} from '@angular/core';

@Component({
    selector: 'my-profile',
    //templateUrl: 'app/templates/Profile.html'
      template: '<div>{{user.name}}</div>'
})
export class AppComponent {
  @Input() user;
}
