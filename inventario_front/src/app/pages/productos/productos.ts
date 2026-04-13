import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Producto } from '../../models/producto';
import { ProductoService } from '../../services/producto';

@Component({
  selector: 'app-productos',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements OnInit {
  productos = signal<Producto[]>([]);
  cargando = signal(false);
  error = signal('');
  editandoId = signal<number | null>(null);
  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly productoService: ProductoService,
  ) {
    this.form = this.fb.nonNullable.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.required]],
      marca: ['', [Validators.required, Validators.maxLength(50)]],
      cantidad_min: [0, [Validators.required, Validators.min(0)]],
      cantidad_max: [0, [Validators.required, Validators.min(0)]],
      precio: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.listarProductos();
  }

  listarProductos(): void {
    this.cargando.set(true);
    this.error.set('');
    this.productoService.listar().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los productos.');
        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.form.getRawValue();
    if (data.cantidad_min > data.cantidad_max) {
      this.error.set('La cantidad minima no puede ser mayor que la maxima.');
      return;
    }

    this.error.set('');

    if (this.editandoId() === null) {
      this.productoService.crear(data).subscribe({
        next: () => {
          this.limpiarFormulario();
          this.listarProductos();
        },
        error: () => {
          this.error.set('No se pudo crear el producto.');
        },
      });
      return;
    }

    this.productoService.actualizar(this.editandoId() as number, data).subscribe({
      next: () => {
        this.limpiarFormulario();
        this.listarProductos();
      },
      error: () => {
        this.error.set('No se pudo actualizar el producto.');
      },
    });
  }

  editar(producto: Producto): void {
    this.editandoId.set(producto.id ?? null);
    this.form.patchValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      marca: producto.marca,
      cantidad_min: producto.cantidad_min,
      cantidad_max: producto.cantidad_max,
      precio: Number(producto.precio),
    });
  }

  eliminar(producto: Producto): void {
    if (!producto.id) {
      return;
    }

    this.productoService.eliminar(producto.id).subscribe({
      next: () => {
        if (this.editandoId() === producto.id) {
          this.limpiarFormulario();
        }
        this.listarProductos();
      },
      error: () => {
        this.error.set('No se pudo eliminar el producto.');
      },
    });
  }

  cancelarEdicion(): void {
    this.limpiarFormulario();
  }

  private limpiarFormulario(): void {
    this.editandoId.set(null);
    this.error.set('');
    this.form.reset({
      nombre: '',
      descripcion: '',
      marca: '',
      cantidad_min: 0,
      cantidad_max: 0,
      precio: 0,
    });
  }
}
