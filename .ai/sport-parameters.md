# Lista parametrów sportów

## bieganie

### dystans

- jednostka: km
- przykładowa wartość: użytkownik wprowadza "10", w bazie danych zapisywane jest `10`
- opis: Preferowany dystans biegu.

### tempo

- jednostka: sekundy na kilometr
- przykładowa wartość: użytkownik wprowadza "5:30" (min/km), w bazie danych zapisywane jest `330`
- opis: Średnie tempo biegu.

## rower szosowy

### dystans

- jednostka: km
- przykładowa wartość: użytkownik wprowadza "50", w bazie danych zapisywane jest `50`
- opis: Preferowany dystans jazdy.

### prędkość

- jednostka: km/h
- przykładowa wartość: użytkownik wprowadza "30", w bazie danych zapisywane jest `30`
- opis: Średnia prędkość jazdy.

## rower mtb

### dystans

- jednostka: km
- przykładowa wartość: użytkownik wprowadza "25", w bazie danych zapisywane jest `25`
- opis: Preferowany dystans jazdy.

### czas

- jednostka: minuty
- przykładowa wartość: użytkownik wprowadza "1h 30m", w bazie danych zapisywane jest `90`
- opis: Preferowany czas trwania wycieczki.

### przewyższenie

- jednostka: metry
- przykładowa wartość: użytkownik wprowadza "800", w bazie danych zapisywane jest `800`
- opis: Preferowane całkowite przewyższenie podczas jazdy.

## pływanie w basenie

### dystans

- jednostka: metry
- przykładowa wartość: użytkownik wprowadza "1500", w bazie danych zapisywane jest `1500`
- opis: Preferowany dystans do przepłynięcia.

### tempo

- jednostka: sekundy na 100 metrów
- przykładowa wartość: użytkownik wprowadza "2:00" (min/100m), w bazie danych zapisywane jest `120`
- opis: Średnie tempo pływania na 100m.

## pływanie na wodach otwartych

### dystans

- jednostka: metry
- przykładowa wartość: użytkownik wprowadza "2000", w bazie danych zapisywane jest `2000`
- opis: Preferowany dystans do przepłynięcia.

### tempo

- jednostka: sekundy na 100 metrów
- przykładowa wartość: użytkownik wprowadza "2:00" (min/100m), w bazie danych zapisywane jest `120`
- opis: Średnie tempo pływania na 100m.

## rolki

### dystans

- jednostka: km
- przykładowa wartość: użytkownik wprowadza "15", w bazie danych zapisywane jest `15`
- opis: Preferowany dystans do przejechania.

### styl

- jednostka: enum (rekreacyjny, szybki, freestyle)
- przykładowa wartość: użytkownik wybiera "rekreacyjny", w bazie danych zapisywane jest `"rekreacyjny"`
- opis: Preferowany styl jazdy.

## nurkowanie

### głębokość

- jednostka: metry
- przykładowa wartość: użytkownik wprowadza "30", w bazie danych zapisywane jest `30`
- opis: Maksymalna preferowana głębokość nurkowania.

## tenis

### poziom

- jednostka: enum (1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5., 6.0+)
- przykładowa wartość: użytkownik wybiera "średniozaawansowany", w bazie danych zapisywane jest `"średniozaawansowany"`
- opis: Poziom zaawansowania w skali NTRP.
