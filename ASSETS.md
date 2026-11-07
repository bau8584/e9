# 이미지 자산

## 실제 니체 저서 표지

확인일: 2026-11-07. 앞서 `니체 저서 표지 찾기` 채팅에서 확인한 3종을 연결했습니다. 이미지 파일을 프로젝트 안에 보관하고 단일 HTML에도 포함하므로 표지 표시를 위해 별도 네트워크 연결을 요구하지 않습니다.

| 서명 | 표지 판본 | 프로젝트 파일 | 출처 |
|---|---|---|---|
| 차라투스트라는 이렇게 말했다 | 사색의숲 · 한국어판 | `src/assets/covers/zarathustra-sasaek.jpg` | [YES24](https://www.yes24.com/product/goods/109178145) |
| 도덕의 계보학 | 연암서가 · 한국어판 | `src/assets/covers/genealogy-yeonam.jpg` | [교보문고](https://ebook-product.kyobobook.co.kr/dig/epd/sam/E000003225795) |
| Beyond Good and Evil / 선악의 저편 | Penguin Books · 영문판, ISBN 9780141902630 | `src/assets/covers/beyond-good-evil-penguin-flat.jpg` | [Penguin 공식 판본](https://www.penguin.co.uk/books/35479/beyond-good-and-evil-by-nietzsche-friedrich/9780141902630), [앞서 확인한 Apple Books 판본](https://books.apple.com/us/book/beyond-good-and-evil/id374216200) |

영문판은 앞서 확인한 Apple Books 이미지의 여백이 넓어, 같은 ISBN의 출판사 공식 평면 표지를 사용했습니다. 처음 받은 Apple Books 이미지도 `src/assets/covers/beyond-good-evil-penguin.jpg`에 보존했습니다. 실제 출판 표지에는 이미지 생성을 사용하지 않았습니다.

## 생성한 캐릭터 이미지

- 파일: `src/assets/nietzsche.png`
- 생성 도구: 기본 내장 `image_gen` 도구. CLI/API 키를 사용하지 않았습니다.
- 역할: 홈의 니체 캐릭터 배너와 프로필 아바타. 가상의 캐릭터 재해석입니다.
- 생성 원본은 보존하고 프로젝트 안에 복사했습니다.
- 브라우저 캡처는 생성 이미지가 아니라 실제 구현 화면입니다.

## 최종 생성 프롬프트

Create a premium wide 16:9 illustrated hero art asset for HIP讀, a Korean adult literary fandom app. No text or letters, no UI, no borders, no logos. A fictional character reinterpretation of Friedrich Nietzsche, attractive charismatic adult man aged around 40, full distinctive well groomed Nietzsche mustache, dark swept wavy hair, intelligent eyes, high collar charcoal coat and plum cravat. Rich semi-realistic Korean webtoon collectible card illustration with sophisticated painterly lighting. He sits on a leather armchair in a candlelit library holding an open book. Character occupies RIGHT 55 percent, upper body and face prominent, gaze slightly left. LEFT 45 percent is dark deep plum atmospheric bookshelf shadows with broad quiet empty negative space suitable for overlay text. Warm ivory book pages, brown wood, violet ambient light. Mature literary atmosphere. Beautiful polished professional illustration, not a photo, not childish. Match an ivory and violet literary fandom product.
