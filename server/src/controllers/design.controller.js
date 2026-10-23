import {
  createDesign,
  deleteDesign,
  getDesign,
  getDesigns,
  updateDesign,
} from '../services/design.service.js'

function responseData(data) {
  return { design: data }
}

export async function create(request, response) {
  const design = await createDesign(request.user.id, request.body)
  return response.status(201).json(responseData(design))
}

export async function list(request, response) {
  const designs = await getDesigns(request.user.id)
  return response.status(200).json({ designs })
}

export async function read(request, response) {
  const design = await getDesign(request.user.id, request.params.id)
  return response.status(200).json(responseData(design))
}

export async function update(request, response) {
  const design = await updateDesign(request.user.id, request.params.id, request.body)
  return response.status(200).json(responseData(design))
}

export async function remove(request, response) {
  await deleteDesign(request.user.id, request.params.id)
  return response.status(204).send()
}
