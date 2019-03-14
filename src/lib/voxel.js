
var mask = new Int32Array(4096);

function mesher(volume, dims) {
    var vertices = [], faces = []
      , dimsX = dims[0]
      , dimsY = dims[1]
      , dimsXY = dimsX * dimsY;
  
    //Sweep over 3-axes
    for(var d=0; d<3; ++d) {
      var i, j, k, l, w, W, h, n, c
        , u = (d+1)%3
        , v = (d+2)%3
        , x = [0,0,0]
        , q = [0,0,0]
        , du = [0,0,0]
        , dv = [0,0,0]
        , dimsD = dims[d]
        , dimsU = dims[u]
        , dimsV = dims[v]
        , qdimsX, qdimsXY
        , xd
  
      if (mask.length < dimsU * dimsV) {
        mask = new Int32Array(dimsU * dimsV);
      }
  
      q[d] =  1;
      x[d] = -1;
  
      qdimsX  = dimsX  * q[1]
      qdimsXY = dimsXY * q[2]
  
      // Compute mask
      while (x[d] < dimsD) {
        xd = x[d]
        n = 0;
  
        for(x[v] = 0; x[v] < dimsV; ++x[v]) {
          for(x[u] = 0; x[u] < dimsU; ++x[u], ++n) {
            var a = xd >= 0      && volume[x[0]      + dimsX * x[1]          + dimsXY * x[2]          ]
              , b = xd < dimsD-1 && volume[x[0]+q[0] + dimsX * x[1] + qdimsX + dimsXY * x[2] + qdimsXY]
            if (a ? b : !b) {
              mask[n] = 0; continue;
            }
            mask[n] = a ? a : -b;
          }
        }
  
        ++x[d];
  
        // Generate mesh for mask using lexicographic ordering
        n = 0;
        for (j=0; j < dimsV; ++j) {
          for (i=0; i < dimsU; ) {
            c = mask[n];
            if (!c) {
              i++;  n++; continue;
            }
  
            //Compute width
            w = 1;
            while (c === mask[n+w] && i+w < dimsU) w++;
  
            //Compute height (this is slightly awkward)
            for (h=1; j+h < dimsV; ++h) {
              k = 0;
              while (k < w && c === mask[n+k+h*dimsU]) k++
              if (k < w) break;
            }
  
            // Add quad
            // The du/dv arrays are reused/reset
            // for each iteration.
            du[d] = 0; dv[d] = 0;
            x[u]  = i;  x[v] = j;
  
            if (c > 0) {
              dv[v] = h; dv[u] = 0;
              du[u] = w; du[v] = 0;
            } else {
              c = -c;
              du[v] = h; du[u] = 0;
              dv[u] = w; dv[v] = 0;
            }
            var vertex_count = vertices.length;
            vertices.push([x[0],             x[1],             x[2]            ]);
            vertices.push([x[0]+du[0],       x[1]+du[1],       x[2]+du[2]      ]);
            vertices.push([x[0]+du[0]+dv[0], x[1]+du[1]+dv[1], x[2]+du[2]+dv[2]]);
            vertices.push([x[0]      +dv[0], x[1]      +dv[1], x[2]      +dv[2]]);
            faces.push([vertex_count, vertex_count+1, vertex_count+2, vertex_count+3, c]);
  
            //Zero-out mask
            W = n + w;
            for(l=0; l<h; ++l) {
              for(k=n; k<W; ++k) {
                mask[k+l*dimsU] = 0;
              }
            }
  
            //Increment counters and continue
            i += w; n += w;
          }
        }
      }
    }
    return { vertices:vertices, faces:faces };

}

function mesher2(volume, dims) {
 
    var vertices = [], faces = [], x = [0,0,0], n = 0;
  for(x[2]=0; x[2]<dims[2]; ++x[2])
  for(x[1]=0; x[1]<dims[1]; ++x[1])
  for(x[0]=0; x[0]<dims[0]; ++x[0], ++n)
  if(!!volume[n]) {
   

    for(var d=0; d<3; ++d) {
      var t = [x[0], x[1], x[2]]
        , u = [0,0,0]
        , v = [0,0,0];
      u[(d+1)%3] = 1;
      v[(d+2)%3] = 1;
      for(var s=0; s<2; ++s) {
        t[d] = x[d] + s;
       
        var tmp = u;
        u = v;
        v = tmp;
        var vertex_count = vertices.length;
        vertices.push([t[0],           t[1],           t[2]          ]);
        vertices.push([t[0]+u[0],      t[1]+u[1],      t[2]+u[2]     ]);
        vertices.push([t[0]+u[0]+v[0], t[1]+u[1]+v[1], t[2]+u[2]+v[2]]);
        vertices.push([t[0]     +v[0], t[1]     +v[1], t[2]     +v[2]]);
        faces.push([vertex_count, vertex_count+1, vertex_count+2, vertex_count+3, volume[n]]);
      }
 
    }
  }
  return { vertices:vertices, faces:faces };
}

var Voxel = function (lo, hi, fn) {
    var dims = [hi[0]-lo[0], hi[1]-lo[1], hi[2]-lo[2]];
    var data = new Array(dims[2] * dims[1] * dims[0]);

    let n = 0;

    for (var k = lo[2]; k < hi[2]; k++)
      for (var j = lo[1]; j < hi[1]; j++)
        for(var i = lo[0]; i < hi[0]; i++) {
          data[n] =fn(i, j, k);
         
          n++;
        }

    return mesher(data, dims);
}

export default {
  build : Voxel,
} 