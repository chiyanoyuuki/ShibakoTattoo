import { CommonModule, registerLocaleData } from '@angular/common';
import { Component, ElementRef, HostListener, isDevMode, LOCALE_ID, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { GoogleCalendarService } from './services/google-calendar.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CalendarComponent } from './calendar/calendar.component'
import  localeFr from '@angular/common/locales/fr'
import { environment } from '../environments/environment.prod';
import { from } from 'rxjs';
import { GhostComponent } from './ghost/ghost.component';
registerLocaleData(localeFr);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, CalendarComponent, GhostComponent],
  providers: [{ provide: LOCALE_ID, useValue: 'fr' }],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  safe=true;
  events: any;
  admin:boolean = false;
  okmdp:boolean = false;
  mdp="";

  lang = 1;
  data:any;
  firstData:any;
  menuClicked = 2;
  flashs:any;
  firstFlashs:any;
  resa:any = {size:-1};
  flashClicked:any;
  saved=false;
  imageSrc: string = '';
  selectedImage:any="";
  creneaux:any;
  clickedCreneau:any;
  opacity = 1;
  mobile = false;
  showmenu=false;

  randomOffsets: string[] = [];

  adminmenus = ["Contenu","Flashs"];

  isSticky: boolean = false;
  stuckThreshold = 100;
  mobileThreshold = 700;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    if (!this.isSticky && scrollTop > this.stuckThreshold) {
      this.isSticky = true;
    }
    else if(this.isSticky && scrollTop < this.stuckThreshold){
      this.isSticky = false;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    let innerHeight = event.target.innerHeight;
    let innerWidth = event.target.innerWidth;

    if (innerHeight > innerWidth && innerWidth < this.mobileThreshold){this.mobile = true;}
    else {this.showmenu=false;this.mobile = false;}
  }

  constructor(private googleCalendarService: GoogleCalendarService, private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit() {

    let innerHeight = window.innerHeight;
    let innerWidth = window.innerWidth;

    if (innerHeight > innerWidth && innerWidth < this.mobileThreshold)this.mobile = true;
    else this.mobile = false;

    
    for (let i = 0; i < 20; i++) {
      const offset = Math.floor(Math.random() * 685); // ajuster selon la taille de ton image
      this.randomOffsets.push(`-${offset}px`);
    }


    this.loadData();

    this.route.queryParams.subscribe(params => {
      const valeur = params['mode'];
      if(valeur=="admin")
      {
        this.admin = true;
      }
    });
  }

  loadData(){
    this.getData();

    if(this.safe&&isDevMode())
    {
      this.http.get<any>('mockdata.json').subscribe((data:any) => {
        this.events = data;
        console.log(this.events);
      });
    }
    else
    {
      this.loadEvents();
    }

  }

  getTextes():any
  {
    return Object.entries(this.data[this.lang].textes).map(([key, value]) => ({ key, value }));
  }

  clickMenu(i:any)
  {
    window.scrollTo(0, 0);
    this.showmenu = false;
    this.opacity = 0;
    let int = setInterval(()=>{this.menuClicked=i;this.opacity=1;clearInterval(int);},500);
  }

  clickMenuMobile()
  {
    window.scrollTo(0, 0);
    this.showmenu = !this.showmenu;
  }

  getData()
  {
    if(this.safe&&isDevMode())
    {
      this.http.get<any>('data.json').subscribe((data:any) => {
        console.log('MOCK : Shibako Data', data);
        this.data = data;
        this.firstData = JSON.parse(JSON.stringify(this.data));

      });
      
      this.http.get<any>('flashs.json').subscribe((data:any) => {
        this.flashs = data;
        this.firstFlashs = JSON.parse(JSON.stringify(this.flashs));
      });
    }
    else
    {
      this.http
      .get<any>(
        'http' +
          (isDevMode() ? '' : 's') +
          '://chiyanh.cluster031.hosting.ovh.net/shibakogetcontent'
      )
      .subscribe((data) => {
        console.log('HTTP : Shibako Data', data);
        this.data = data.content;
        this.firstData = JSON.parse(JSON.stringify(this.data));
        this.flashs = data.flashs;
        this.firstFlashs = JSON.parse(JSON.stringify(this.flashs));
      });
    }
  }

  loadEvents() {
    this.events = [];
    let int = setInterval(()=>{
      this.googleCalendarService.getPublicEvents().subscribe(
        (data:any) => {
          console.log(data);
          data.items.forEach((d:any)=>{
            let event : any = {};
            if(d.start.dateTime) event = {start:d.start.dateTime,end:d.end.dateTime};
            else event = {start:d.start.date,end:d.end.date};
            this.events.push(event);
          })
          console.log(this.events);
        }
      );
      clearInterval(int);
    },1000);
  }
  
  getRandomOffset(index: number): string {
    return this.randomOffsets[index];
  }

  getFlashFields(full:boolean=false)
  {
      return this.data[this.lang].contact.filter((c:any)=>(full?c.type=='textarea':c.type!='textarea')&&c.flash==undefined);
  }

  openInsta()
  {
    window.open('https://www.instagram.com/shibako_tattoo/?hl=fr', '_blank');
  }

  generateRange(n: number): number[] {
    return new Array(n).fill(0).map((_, index) => index);
  }

  reserverFlash(flash:any)
  {
    window.scrollTo(0, 0);
    this.creneaux = [];
    this.clickedCreneau = -1;
    this.flashClicked = flash;
  }

  reserver()
  {
    let creneau = this.creneaux[this.clickedCreneau];
    this.googleCalendarService.addEvent(creneau)
    .then((response:any) => {
      this.events.push(creneau);
      this.flashClicked.reserved = true;
      this.buyFlash(this.flashClicked);
    })
  }

  checkMdp()
  {
    if(this.mdp==environment.mdp)this.okmdp=true;
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  goToSite(){
    window.open(environment.site, '_blank');
  }

  nothingChanged()
  {
    return JSON.stringify(this.data)==JSON.stringify(this.firstData)
    && JSON.stringify(this.flashs)==JSON.stringify(this.firstFlashs);
  }

  isFlashNotOver()
  {
    return this.flashs.find((flash:any)=>flash.nom==""||flash.univers==""||flash.temps==""||flash.prix==0||flash.img=="")!=undefined;
  }

  saveAdminData()
  {
      let data = { 
        content: this.data,
        flashs: this.flashs
      };
      from(
        fetch(
          'http' +
            (isDevMode() ? '' : 's') +
            '://chiyanh.cluster031.hosting.ovh.net/shibakosetcontent',
          {
            body: JSON.stringify(data),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
            mode: 'no-cors',
          }
        ).then((data: any) => {
          this.saved = true;
          this.firstData = JSON.parse(JSON.stringify(this.data));
          this.firstFlashs = JSON.parse(JSON.stringify(this.flashs));
        })
      );
  }

  selectImage(flash:any, imgName:boolean = false) {
    this.selectedImage = flash;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      console.warn("Aucun fichier sélectionné");
      return;
    }
  
    const file = input.files[0]; // Prend uniquement le premier fichier
  
    // Vérifie que c'est bien une image
    if (!file.type.startsWith("image/")) {
      console.warn("Ce fichier n'est pas une image");
      return;
    }
  
    // 🎨 Afficher un aperçu de l’image
    const reader = new FileReader();
    reader.onload = () => {
      this.imageSrc = reader.result as string;
    };
    reader.readAsDataURL(file);
  
    // 🚀 Envoyer l’image au serveur
    this.uploadImage(file);
  }

  uploadImage(file: File) {
    let fileName = file.name;

    if(this.selectedImage.img=="") this.selectedImage.img = file.name;
    else{fileName = this.selectedImage.img.substring(0,this.selectedImage.img.indexOf(".")) + file.name.substring(file.name.indexOf("."));}

    let data = new FormData();
    data.append("imageName", fileName);  // Nom du fichier
    data.append("dir", "flashs");         // Dossier de destination
    data.append("file", file);            // Le fichier sélectionné
    
    from(
      fetch(
        'https' + (isDevMode() ? '' : 's') + '://chiyanh.cluster031.hosting.ovh.net/shibakouploadimage',
        {
          body: data,
          method: 'POST',
          mode: 'no-cors' // Assure que le serveur autorise les requêtes cross-origin
        }
      ).then((dat:any)=>{
        this.selectedImage.img = fileName;
        const images = document.querySelectorAll("img"); // Sélectionne toutes les images

        images.forEach((img) => {
          if (img.src.includes("/"+fileName)) {
            img.src = img.src;
            if(img.src.includes("?"))
            {
              img.src = img.src.substring(0,img.src.indexOf("?"));
            } 
            img.src = img.src + "?t=" + new Date().getTime();
          }
        });
      }
    ));
  }

  clickDeleteFlash(flash:any)
  {
    if(!flash.deleted) flash.deleted = true;
    else delete flash.deleted;
  }

  addFlash()
  {
    this.flashs.push({
      "nom": "",
      "univers": "",
      "temps": "",
      "prix": 0,
      "img": ""
    });
    this.firstFlashs.push({
      "nom": "NEW FLASH",
      "univers": "",
      "temps": "",
      "prix": 0,
      "img": ""
    });
  }

  onClickDay(creneaux:any)
  {
    this.creneaux = creneaux;
  }
  
  formatTimeSlot(slot: { start: string; end: string }): string {
    const formatTime = (dateStr: string) => {
      const date = new Date(dateStr);
      return `${date.getHours()}h${date.getMinutes().toString().padStart(2, '0')}`;
    };
  
    return `${formatTime(slot.start)} - ${formatTime(slot.end)}`;
  }

  formatEventDate(event: { start: string; end: string }): string {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(/^\w/, (c) => c.toUpperCase()); // Met en majuscule la première lettre
    };
    let retour = formatDate(event.start);
    return retour;
  }

  getFlashs()
  {
    return this.flashs?this.flashs.filter((f:any)=>!f.reserved):[];
  }
  
  buyFlash(flash:any)
  {
    this.http
      .get<any>(
        'http' +
          (isDevMode() ? '' : 's') +
          '://chiyanh.cluster031.hosting.ovh.net/shibakogetcontent'
      )
      .subscribe((data) => {
        console.log('HTTP : Shibako Data', data);
        this.data = data.content;
        this.firstData = JSON.parse(JSON.stringify(this.data));
        this.flashs = data.flashs;
        this.firstFlashs = JSON.parse(JSON.stringify(this.flashs));

        let flashClicked = this.flashs.find((f:any)=>f.nom==flash.nom&&f.univers==flash.univers);
        if(flashClicked)
        {
          flashClicked.reserved = true;
          this.saveAdminData();
        }
      });
    }

    onFileSelect(event: any) {
      this.resa.selectedFiles = Array.from(event.target.files);
    }

    sendMail() {
      const formDataToSend = new FormData();
      
      // Ajouter les données du formulaire
      Object.keys(this.resa).forEach((key) => {
        if(key!="selectedFiles")
        {
          if(key=="size")
            formDataToSend.append(key, this.data[this.lang].contact.find((c:any)=>c.id=="size").options[this.resa[key]]);
          else
            formDataToSend.append(key, this.resa[key]);
        }
      });
  
      // Ajouter les fichiers
      this.resa.selectedFiles.forEach((file:any, index:any) => {
        formDataToSend.append(`files[]`, file);
      });

          from(
            fetch(
              'https' + (isDevMode() ? '' : 's') + '://chiyanh.cluster031.hosting.ovh.net/shibakosendmail',
              {
                body: formDataToSend,
                method: 'POST',
                mode: 'no-cors' // Assure que le serveur autorise les requêtes cross-origin
              }
            ).then((dat:any)=>{

            }
          ));
    }
}
