<?php

use PhpParser\Node\Scalar\Float_;

$nom = readline('Saisissez votre nom complet :');
$prenom = readline('Saisisez votre prenom :');
$age =readline('Saisissez votre age:');

if($age >30){
    echo('Bonjour '.' '.$nom .' '.$prenom.'  '.' '.('Vous etes eligible a rentrer dans la sale'));
} elseif($age == 30){
    echo('Bonjour'.' '.$nom.' '.$prenom.'  '. 'Vous avez l\'age Réquis');
}else{
    echo('Bonjour').' '.$nom.' '.$prenom.' '.'Vous avez'.' '.$age.'  '.('Vous n\'etes pas éliglible à entré vous n\'avez pas un age requis pour y acceder');
}

$nom = readline('Saisir votre nom et prenom');
$mois=readline('Saisir votre mois de naissance');

if ($mois == 'Janvier'){
    echo('Bonjour'.'  '.$nom.'  '.'Votre mois de naissance est'.' '.$mois.' '.'Et donc votre signe astrologique est Lion');
}elseif($mois == 'Mars'.'Avril'){
      echo('Bonjour'.'  '.$nom.'  '.'Votre mois de naissance est'.' '.$mois.' '.'Et donc votre signe astrologique est Tauraux');
}else{
        echo('Bonjour'.'  '.$nom.' '.'Le mois de naissance que vous avez saisi n\'a pas de signe astrologique');
}