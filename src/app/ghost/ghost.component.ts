import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Ghost {
  top: number;
  left: number;
  scale: number;
  rotate: number;
  opacity: number;
}

@Component({
  selector: 'app-ghost',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ghost.component.html',
  styleUrl: './ghost.component.scss'
})
export class GhostComponent implements OnInit {
  ghostImage: string = 'orbe.png';
  ghosts: Ghost[] = [];

  screenW = window.innerWidth;
  screenH = window.outerHeight;

  ngOnInit() {
    // Crée 3 fantômes au début
    this.ghosts = Array.from({ length: 20 }, () => this.randomGhost());

    let int = setInterval(() => {
      this.ghosts.forEach((ghost) => {
        ghost.top = Math.random() * (this.screenH + 500) - 250;
        ghost.left = Math.random() * (this.screenW + 500) - 250;
        ghost.scale = 0.2 + Math.random();
        ghost.rotate = Math.random() * 360;
        ghost.opacity = Math.random()*0.2+0.1;
      });
      clearInterval(int);
    }, 10);

    // Met à jour leur position aléatoire toutes les 3 secondes
    setInterval(() => {
      this.ghosts.forEach((ghost) => {
        ghost.top = Math.random() * (this.screenH + 500) - 250;
        ghost.left = Math.random() * (this.screenW + 500) - 250;
        ghost.scale = 0.2 + Math.random();
        ghost.rotate = Math.random() * 360;
        ghost.opacity = Math.random()*0.2+0.1;
      });
    }, 10000);
  }

  randomGhost(): Ghost {
    return {
      top: Math.random() * (this.screenH + 400) - 200,
      left: Math.random() * (this.screenW + 400) - 200,
      scale: 0.2 + Math.random(),
      rotate: Math.random() * 360,
      opacity: Math.random()*0.2+0.1
    };
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.screenW = event.target.innerWidth;
    this.screenH = event.target.innerHeight;
  }
}