
import React from 'react';
import { Role, Product, User } from './types';

export const ADMIN_EMAIL = 'marcelo.zaiden@mectria.com';
export const TOKEN_RATE = 0.4; // 1h = 0.4 tokens

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Garrafa Mectria', price: 45, image: 'https://images.unsplash.com/photo-1602143399827-7211bf3a67d0?auto=format&fit=crop&q=80&w=400' },
  { id: '2', name: 'Caderno Mectria', price: 27, image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=400' },
  { id: '3', name: 'Caneta Mectria', price: 10, image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=400' },
  { id: '5', name: 'Adesivo Mectria', price: 5, image: 'https://images.unsplash.com/photo-1572375927502-1f237f11381c?auto=format&fit=crop&q=80&w=400' },
  { id: '6', name: 'Açaí', price: 35, image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&q=80&w=400' },
  { id: '7', name: 'Combo Punch', price: 35, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400' },
  { id: '8', name: 'Moletom Mectria', price: 80, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400' },
];

const MEMBER_DATA = [
  { name: "João Luiz Mateus de Lima", email: "joao.lima@mectria.com", cid: "João Luiz Mateus de Lima" },
  { name: "Lucas Antônio Borella Gabriel de Oliveira", email: "lucas.oliveira@mectria.com", cid: "Lucas Antônio Borella Gabriel de Oliveira" },
  { name: "José Eduardo dos Santos Araujo", email: "jose.araujo@mectria.com", cid: "José Eduardo dos Santos Araujo" },
  { name: "Arthur Menezes Jordão", email: "arthur.jordao@mectria.com", cid: "Arthur Menezes Jordão" },
  { name: "Isabela da Cunha Aires", email: "isabela.aires@mectria.com", cid: "Isabela da Cunha Aires" },
  { name: "Pedro Henrique Grizzo E Silva", email: "pedro.grizzo@mectria.com", cid: "Pedro Henrique Grizzo E Silva" },
  { name: "Marcelo Lino Zaiden Casadio Gonçalves", email: "marcelo.zaiden@mectria.com", cid: "Marcelo Lino Zaiden Casadio Gonçalves" },
  { name: "Rafael Assis Lustosa", email: "rafael.lustosa@mectria.com", cid: "Rafael Assis Lustosa" },
  { name: "Murilo Ceciliato Perão", email: "murilo.perao@mectria.com", cid: "Murilo Ceciliato Perão" },
  { name: "João Antunes", email: "joao.antunes@mectria.com", cid: "João Antunes" },
  { name: "João Vitor Ramos da Silveira", email: "joao.ramos@mectria.com", cid: "João Vitor Ramos da Silveira" },
  { name: "Bruno Roberto Biancalana David Sandoval", email: "bruno.sandoval@mectria.com", cid: "Bruno Roberto Biancalana David Sandoval" },
  { name: "Léo Victor Quereguini", email: "leoquereguini@mectria.com", cid: "Léo Victor Quereguini" },
  { name: "Iany Carvalho de Andrade", email: "iany.andrade@mectria.com", cid: "Iany Carvalho de Andrade" },
  { name: "Mateus Correa Bonato", email: "mateus.bonato@mectria.com", cid: "Mateus Correa Bonato" },
  { name: "Kaio César Carneiro Ferreira", email: "kaio.ferreira@mectria.com", cid: "Kaio César Carneiro Ferreira" },
  { name: "João Pedro Honorato Pinto Teixeira", email: "joao.teixeira@mectria.com", cid: "João Pedro Honorato Pinto Teixeira" },
  { name: "Tulio Lima Prado", email: "tulio.prado@mectria.com", cid: "Tulio Lima Prado" },
  { name: "Gustavo Almeida", email: "gustavo.almeida@mectria.com", cid: "Gustavo Almeida" },
  { name: "João Guilherme Freitas", email: "joao.freitas@mectria.com", cid: "João Guilherme Freitas" },
  { name: "Caue Fantaccini", email: "caue.fantaccini@mectria.com", cid: "Caue Fantaccini" },
  { name: "Carlos Felicio", email: "carlos.felicio@mectria.com", cid: "Carlos Felicio" },
  { name: "Gabriel Falcão de Araújo", email: "gabriel.falcao@mectria.com", cid: "Gabriel Falcão de Araújo" },
  { name: "Lucas Vieira Malaquias", email: "lucas.malaquias@mectria.com", cid: "Lucas Vieira Malaquias" },
  { name: "Henrique Vitorasso de Assis Oliveira", email: "henrique.vitorasso@mectria.com", cid: "Henrique Vitorasso de Assis Oliveira" },
  { name: "Pedro Otávio Oliveira Lacerda", email: "pedro.lacerda@mectria.com", cid: "Pedro Otávio Oliveira Lacerda" },
  { name: "Vinícius da Silva Gomes", email: "vinicius.gomes@mectria.com", cid: "Vinícius da Silva Gomes" },
  { name: "Cauã Sene Urzedo", email: "caua.urzedo@mectria.com", cid: "Cauã Sene Urzedo" },
  { name: "Vinicius Fargnolli", email: "vinicius.fargnolli@mectria.com", cid: "Vinicius Fargnolli" },
  { name: "João Gabriel Alves Rincon", email: "joao.rincon@mectria.com", cid: "João Gabriel Alves Rincon" },
  { name: "Bernardo Rodrigues Rezende", email: "bernardo.rezende@mectria.com", cid: "Bernardo Rodrigues Rezende" },
  { name: "Victor Hugo Lemos", email: "victor.lemos@mectria.com", cid: "Victor Hugo Lemos" },
  { name: "Eduardo Fargnolli", email: "eduardo.fargnolli@mectria.com", cid: "Eduardo Fargnolli" },
  { name: "Victória Graça Baldoíno Pessoa", email: "victoria.pessoa@mectria.com", cid: "Victória Graça Baldoíno Pessoa" }
];

export const INITIAL_MEMBERS: User[] = MEMBER_DATA.map((data, index) => ({
  id: `m${index + 1}`,
  name: data.name,
  email: data.email,
  role: data.email === ADMIN_EMAIL ? Role.ADMIN : Role.USER,
  clockifyId: data.cid,
  balance: 0,
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`
}));

export const GearLogo = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/swap">
    <path d="M50 0L55 15L70 10L65 25L80 20L75 35L90 30L85 45L100 40L95 55L100 70L85 65L90 80L75 75L80 90L65 85L70 100L55 95L50 110V95L45 100L40 85L35 90L25 80L30 65L15 70L20 55L0 60L5 45L0 30L15 35L10 20L25 25L20 10L35 15L30 0L45 5L50 0Z" fill="#8B0000" />
    <circle cx="50" cy="50" r="20" fill="white" />
    <circle cx="50" cy="50" r="12" fill="#8B0000" />
  </svg>
);
