export interface Chapter {
  image: string;
  title: string;
  desc: string;
  author: string;
}

export interface ChapterPart {
  titre: string;
  chapitres: Chapter[];
}

export interface ChaptersData {
  premiere_partie: ChapterPart;
  deuxieme_partie: ChapterPart;
  troisieme_partie: ChapterPart;
}
